import { NextResponse } from 'next/server';
import { notion } from '@/lib/notion-client';
import { getDataClient } from '@/lib/client-factory';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const client = getDataClient();
        const projects = await client.getProjects();
        const youtubeProject = projects.find(p => p.platform === 'youtube');

        if (!youtubeProject) {
            return NextResponse.json({ success: false, error: 'No YouTube project found' }, { status: 404 });
        }

        const fakeYoutubeSubscribers = 15000;
        const metricsDbId = process.env.NOTION_METRICS_DB_ID || '';

        // Query Notion to see if this project already has a "Subscribers" metric
        const existingMetrics = await notion.databases.query({
            database_id: metricsDbId,
            filter: {
                and: [
                    {
                        property: 'name',
                        title: { equals: 'Subscribers' }
                    },
                    {
                        property: 'projects',
                        relation: { contains: youtubeProject.id }
                    }
                ]
            }
        });

        // Upsert Logic
        if (existingMetrics.results.length > 0) {
            // Update the existing metric row
            const existingPageId = existingMetrics.results[0].id;
            await notion.pages.update({
                page_id: existingPageId,
                properties: {
                    'value': { number: fakeYoutubeSubscribers }
                }
            });
        } else {
            // Create a new metric row if one didn't exist
            await notion.pages.create({
                parent: { database_id: metricsDbId },
                properties: {
                    'name': { title: [{ text: { content: 'Subscribers' } }] },
                    'value': { number: fakeYoutubeSubscribers },
                    'projects': { relation: [{ id: youtubeProject.id }] },
                },
            });
        }

        return NextResponse.json({ success: true, message: 'Updated metrics successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
