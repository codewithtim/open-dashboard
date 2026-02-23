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

        await notion.pages.create({
            parent: { database_id: process.env.NOTION_METRICS_DB_ID || '' },
            properties: {
                'name': { title: [{ text: { content: 'Subscribers' } }] },
                'value': { number: fakeYoutubeSubscribers },
                'projects': { relation: [{ id: youtubeProject.id }] },
            },
        });

        return NextResponse.json({ success: true, message: 'Updated metrics successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
