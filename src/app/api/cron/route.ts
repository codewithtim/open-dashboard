import { NextResponse } from 'next/server';
import { notion } from '@/lib/notion-client';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const fakeYoutubeSubscribers = 15000;

        await notion.pages.create({
            parent: { database_id: process.env.NOTION_METRICS_DB_ID || '' },
            properties: {
                'Metric Name': { title: [{ text: { content: 'Subscribers' } }] },
                'Value': { number: fakeYoutubeSubscribers },
                'Date': { date: { start: new Date().toISOString().split('T')[0] } },
                'Project_ID': { rich_text: [{ text: { content: 'youtube-main' } }] },
            },
        });

        return NextResponse.json({ success: true, message: 'Updated metrics successfully.' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
