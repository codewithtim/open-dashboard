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
            }),
            getProjects: jest.fn().mockResolvedValue([
                { id: '1', name: 'Software App', type: 'software', status: 'Active' },
                { id: '2', name: 'YouTube Channel', type: 'content', status: 'Active' }
            ]),
            getMultipleProjectDetails: jest.fn().mockResolvedValue([
                {
                    id: '1',
                    name: 'Software App',
                    type: 'software',
                    status: 'Active',
                    totalRevenue: 2000,
                    totalCosts: 400,
                    netProfit: 1600,
                    metrics: [{ name: 'MRR', value: 300 }]
                },
                {
                    id: '2',
                    name: 'YouTube Channel',
                    type: 'content',
                    status: 'Active',
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

        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getAllByText('$5,000').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Net Profit')).toBeInTheDocument();
        expect(screen.getByText('$4,000')).toBeInTheDocument();
        expect(screen.getByText('Active Projects')).toBeInTheDocument();
        expect(screen.getByText('Software App')).toBeInTheDocument();
        expect(screen.getByText('YouTube Channel')).toBeInTheDocument();

        // Assert deeply nested metrics from getMultipleProjectDetails reflect
        expect(mockClient.getMultipleProjectDetails).toHaveBeenCalledWith(['1', '2']);

        // Project 1 Metrics & Costs
        expect(screen.getByText('$2,000')).toBeInTheDocument(); // Revenue
        expect(screen.getByText('$1,600')).toBeInTheDocument(); // Profit
        expect(screen.getByText('$400')).toBeInTheDocument(); // Total Costs
        expect(screen.getByText('MRR')).toBeInTheDocument();
        expect(screen.getByText('300')).toBeInTheDocument();

        // Project 2 Metrics & Costs
        expect(screen.getByText('$3,000')).toBeInTheDocument(); // Revenue
        expect(screen.getByText('$2,400')).toBeInTheDocument(); // Profit
        expect(screen.getByText('$600')).toBeInTheDocument(); // Total Costs
        expect(screen.getByText('Subscribers')).toBeInTheDocument();
        expect(screen.getByText('15,000')).toBeInTheDocument();

        // Progress bar renders with totalRevenue against $1M goal
        expect(screen.getByTestId('progress-filler')).toBeInTheDocument();
        expect(screen.getByText('Goal: $1,000,000')).toBeInTheDocument();
    });
});
