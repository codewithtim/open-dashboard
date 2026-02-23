import { render, screen } from '@testing-library/react';
import ProjectPage from '../projects/[id]/page';
import { getDataClient } from '@/lib/client-factory';
import { notFound } from 'next/navigation';
import React from 'react';

jest.mock('@/lib/client-factory', () => {
    return {
        getDataClient: jest.fn(),
    };
});

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => { throw new Error('NOT_FOUND'); }),
}));

jest.mock('next/link', () => {
    return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('Project Detail Page', () => {
    it('calls notFound when project is null', async () => {
        const mockClient = { getProjectDetails: jest.fn().mockResolvedValue(null) };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);
        let error;
        try {
            await ProjectPage({ params: Promise.resolve({ id: 'missing' }) });
        } catch (e) {
            error = e;
        }
        expect(notFound).toHaveBeenCalled();
        expect(error).toBeDefined();
    });

    it('renders project details and specific metrics', async () => {
        const mockClient = {
            getProjectDetails: jest.fn().mockResolvedValue({
                id: 'p-1',
                name: 'Test Project',
                type: 'Service',
                status: 'Active',
                totalCosts: 100,
                totalRevenue: 500,
                netProfit: 400,
                metrics: [
                    { name: 'MRR', value: 50 }
                ]
            })
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);
        const page = await ProjectPage({ params: Promise.resolve({ id: 'p-1' }) });
        render(page);

        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('Service • Active')).toBeInTheDocument();

        expect(screen.getByText('Project Profit')).toBeInTheDocument();
        expect(screen.getByText('$400')).toBeInTheDocument();

        expect(screen.getByText('Key Metrics')).toBeInTheDocument();
        expect(screen.getByText('MRR')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
    });
});
