import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function initDatabases() {
    const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
    if (!parentPageId || parentPageId === 'dummy_page_id') {
        console.warn('Real NOTION_PARENT_PAGE_ID is required to actually create databases. Using mock execution.');
        // Mock run
        console.log('Created Mock Projects Database: mock_projects_id');
        console.log('Created Mock Costs Database: mock_costs_id');
        console.log('Created Mock Revenue Database: mock_revenue_id');
        console.log('Created Mock Metrics Database: mock_metrics_id');
        return;
    }

    // Real execution would create DBs here
    console.log('Creating Databases in Notion...');
}

initDatabases().catch(console.error);
