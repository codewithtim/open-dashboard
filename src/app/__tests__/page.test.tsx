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
            getProjects: jest.fn().mockResolvedValue([
                { id: '1', name: 'Software App', type: 'software', status: 'active' },
                { id: '2', name: 'YouTube Channel', type: 'content', status: 'active' }
            ]),
            getMultipleProjectDetails: jest.fn().mockResolvedValue([
                {
                    id: '1',
                    name: 'Software App',
                    type: 'software',
                    status: 'active',
                    totalRevenue: 2000,
                    totalCosts: 400,
                    netProfit: 1600,
                    metrics: [{ name: 'MRR', value: 300 }]
                },
                {
                    id: '2',
                    name: 'YouTube Channel',
                    type: 'content',
                    status: 'active',
                    totalRevenue: 3000,
                    totalCosts: 600,
                    netProfit: 2400,
                    metrics: [{ name: 'Subscribers', value: 15000 }]
                }
            ])
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await DashboardPage();
        render(page);

        // Assert central stats hub metrics are rendered
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getAllByText('$5,000').length).toBeGreaterThanOrEqual(1);

        // Net Profit, Costs, and generic DashboardCards are no longer used on the main screen in the new redesign
        // Replaced by CentralStatsHub specific stats
        expect(screen.getAllByText(/Subscribers/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('25,000')).toBeInTheDocument();

        expect(screen.getAllByText('Views').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('200,000')).toBeInTheDocument();

        // Active Users no longer in top shelf, it's specific to the project row metrics

        expect(screen.getByText('Active Projects Activity')).toBeInTheDocument();
        expect(screen.getAllByText('Software App').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('YouTube Channel').length).toBeGreaterThanOrEqual(1);

        // Assert deeply nested metrics from getMultipleProjectDetails reflect
        expect(mockClient.getMultipleProjectDetails).toHaveBeenCalledWith(['1', '2']);

        // Project 1 Metrics & Costs
        expect(screen.getByText('$2,000')).toBeInTheDocument(); // Revenue
        expect(screen.getByText('$1,600')).toBeInTheDocument(); // Profit
        expect(screen.getByText('$400')).toBeInTheDocument(); // Total Costs
        expect(screen.getByText('MRR')).toBeInTheDocument();
        expect(screen.getByText('$300')).toBeInTheDocument();

        // Project 2 Metrics & Costs
        expect(screen.getByText('$3,000')).toBeInTheDocument(); // Revenue
        expect(screen.getByText('$2,400')).toBeInTheDocument(); // Profit
        expect(screen.getByText('$600')).toBeInTheDocument(); // Total Costs
        expect(screen.getAllByText(/Subscribers/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('15,000')).toBeInTheDocument();

        // Progress bar is no longer rendered in the hero section
    });
});
