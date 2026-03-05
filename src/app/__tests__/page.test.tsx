import { render, screen } from '@testing-library/react';
import DashboardPage from '../page';
import { getDataClient } from '@/lib/client-factory';
import React from 'react';

jest.mock('@/lib/client-factory', () => {
    return {
        getDataClient: jest.fn(),
    };
});

jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Dashboard Home Page', () => {
    it('renders global stats and projects with deep metrics', async () => {
        const mockClient = {
            getAggregatedDashboardStats: jest.fn().mockResolvedValue({
                totalRevenue: 5000,
                totalCosts: 1000,
                netProfit: 4000,
                totalSubscribers: 25000,
                totalViews: 200000,
                totalActiveUsers: 350
            }),
            getAllProjects: jest.fn().mockResolvedValue([
                { id: '1', name: 'Software App', type: 'software', status: 'active' },
                { id: '2', name: 'YouTube Channel', type: 'content', status: 'active' },
                { id: '3', name: 'Old Crypto App', type: 'software', status: 'archived' }
            ]),
            getProjects: jest.fn().mockResolvedValue([
                { id: '1', name: 'Software App', type: 'software', status: 'active' },
                { id: '2', name: 'YouTube Channel', type: 'content', status: 'active' }
            ]),
            getMultipleProjectDetails: jest.fn().mockImplementation((ids: string[]) => {
                const all: Record<string, any> = {
                    '1': {
                        id: '1',
                        name: 'Software App',
                        type: 'software',
                        status: 'active',
                        totalRevenue: 2000,
                        totalCosts: 400,
                        netProfit: 1600,
                        metrics: [{ name: 'MRR', value: 300 }]
                    },
                    '2': {
                        id: '2',
                        name: 'YouTube Channel',
                        type: 'content',
                        status: 'active',
                        totalRevenue: 3000,
                        totalCosts: 600,
                        netProfit: 2400,
                        metrics: [{ name: 'Subscribers', value: 15000 }]
                    },
                    '3': {
                        id: '3',
                        name: 'Old Crypto App',
                        type: 'software',
                        status: 'archived',
                        totalRevenue: 500,
                        totalCosts: 1800,
                        netProfit: -1300,
                        metrics: []
                    }
                };
                return Promise.resolve(ids.map((id: string) => all[id]).filter(Boolean));
            }),
            getRecentActivity: jest.fn().mockResolvedValue([
                {
                    id: 'a1',
                    type: 'commit',
                    timestamp: '2025-01-15T15:00:00Z',
                    projectName: 'SaaS App',
                    externalId: 'commit:abc123',
                    payload: {
                        sha: 'abc123',
                        message: 'feat: add auth',
                        author: 'tim',
                        htmlUrl: 'https://github.com/t/r/commit/abc123',
                        repo: 't/r',
                    },
                },
                {
                    id: 'a2',
                    type: 'tweet',
                    timestamp: '2025-01-15T14:00:00Z',
                    externalId: 'tweet:999',
                    payload: {
                        text: 'Shipped a new feature!',
                        likeCount: 10,
                        retweetCount: 2,
                        replyCount: 1,
                    },
                },
            ])
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await DashboardPage();
        render(page);

        // Stat cards
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getAllByText('$5,000').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Net Profit')).toBeInTheDocument();
        expect(screen.getByText('$4,000')).toBeInTheDocument();
        expect(screen.getAllByText(/Subscribers/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('25,000')).toBeInTheDocument();
        expect(screen.getAllByText('Views').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('200,000')).toBeInTheDocument();

        // Projects table headings
        expect(screen.getByText('Active Projects')).toBeInTheDocument();
        expect(screen.getByText('Inactive Projects')).toBeInTheDocument();

        // Projects table
        expect(screen.getAllByText('Software App').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('YouTube Channel').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Old Crypto App')).toBeInTheDocument();
        expect(mockClient.getMultipleProjectDetails).toHaveBeenCalledWith(['1', '2']);
        expect(mockClient.getMultipleProjectDetails).toHaveBeenCalledWith(['3']);

        // Project 1 table row data
        expect(screen.getByText('$2,000')).toBeInTheDocument(); // Revenue
        expect(screen.getByText('$1,600')).toBeInTheDocument(); // Profit
        expect(screen.getByText('$400')).toBeInTheDocument(); // Costs
        expect(screen.getByText('300 MRR')).toBeInTheDocument(); // Key metric

        // Project 2 table row data
        expect(screen.getByText('$3,000')).toBeInTheDocument(); // Revenue
        expect(screen.getByText('$2,400')).toBeInTheDocument(); // Profit
        expect(screen.getByText('$600')).toBeInTheDocument(); // Costs
        expect(screen.getByText('15,000 Subscribers')).toBeInTheDocument(); // Key metric

        // Activity feed
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        expect(screen.getByText('feat: add auth')).toBeInTheDocument();
        expect(screen.getByText('Shipped a new feature!')).toBeInTheDocument();
    });

    it('hides activity feed when no events', async () => {
        const mockClient = {
            getAggregatedDashboardStats: jest.fn().mockResolvedValue({
                totalRevenue: 0, totalCosts: 0, netProfit: 0,
                totalSubscribers: 0, totalViews: 0, totalActiveUsers: 0
            }),
            getAllProjects: jest.fn().mockResolvedValue([]),
            getProjects: jest.fn().mockResolvedValue([]),
            getMultipleProjectDetails: jest.fn().mockResolvedValue([]),
            getRecentActivity: jest.fn().mockResolvedValue([]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await DashboardPage();
        render(page);

        expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
    });
});
