import { render, screen } from '@testing-library/react';
import { DefaultProjectRow } from '../default-row';
import { ProjectDetails } from '@/lib/data-client';

const mockProject: ProjectDetails = {
    id: 'test-1',
    name: 'Test Project',
    type: 'service',
    status: 'active',
    totalRevenue: 10000,
    totalCosts: 2000,
    netProfit: 8000,
    metrics: [{ name: 'Custom Metric', value: 42 }]
};

describe('DefaultProjectRow', () => {
    it('renders project basic details and financial metrics', () => {
        render(<DefaultProjectRow project={mockProject} />);

        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('service')).toBeInTheDocument();

        // Assert Revenue, Profit, and Costs are formatted and displayed
        expect(screen.getByText('$10,000')).toBeInTheDocument();
        expect(screen.getByText('$8,000')).toBeInTheDocument();
        expect(screen.getByText('$2,000')).toBeInTheDocument();

        // Assert fallback custom metrics
        expect(screen.getByText('Custom Metric')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
    });
});
