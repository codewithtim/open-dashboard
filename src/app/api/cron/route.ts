import { NextResponse } from 'next/server';
import { notion } from '@/lib/notion-client';
import { getDataClient } from '@/lib/client-factory';
import { getMetricsProvider } from '@/lib/providers';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const client = getDataClient();
        const projects = await client.getProjects();
        const metricsDbId = process.env.NOTION_METRICS_DB_ID || '';

        for (const project of projects) {
            if (!project.platform || !project.platformAccountId) continue;

            try {
                const provider = getMetricsProvider(project.platform);
                const metrics = await provider.getMetrics(project.platformAccountId);

                // Map the standardized SocialMetrics into an array of { name, value } for iterative upserting
                const metricEntries = [
                    { name: 'Subscribers', value: metrics.subscribers },
                    { name: 'Views', value: metrics.views },
                    { name: 'Videos', value: metrics.videos },
                ].filter(m => m.value !== undefined) as Array<{ name: string; value: number }>;

                for (const entry of metricEntries) {
                    // Query Notion to see if this project already has this metric row
                    const existingMetrics = await notion.databases.query({
                        database_id: metricsDbId,
                        filter: {
                            and: [
                                { property: 'name', title: { equals: entry.name } },
                                { property: 'projects', relation: { contains: project.id } }
                            ]
                        }
                    });

                    // Upsert Logic
                    if (existingMetrics.results.length > 0) {
                        const existingPageId = existingMetrics.results[0].id;
                        await notion.pages.update({
                            page_id: existingPageId,
                            properties: {
                                'value': { number: entry.value }
                            }
                        });
                    } else {
                        await notion.pages.create({
                            parent: { database_id: metricsDbId },
                            properties: {
                                'name': { title: [{ text: { content: entry.name } }] },
                                'value': { number: entry.value },
                                'projects': { relation: [{ id: project.id }] },
                            },
                        });
                    }
                }
            } catch (err) {
                // Log and continue to the next project without failing the entire cron
                console.error(`Failed to process metrics for project ${project.name}:`, err);
            }
        }

        return NextResponse.json({ success: true, message: 'Updated metrics successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
