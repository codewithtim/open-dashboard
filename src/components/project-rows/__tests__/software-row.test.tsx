import { render, screen } from '@testing-library/react';
import { SoftwareProjectRow } from '../software-row';
import { ProjectDetails } from '@/lib/data-client';

const mockSoftwareProject: ProjectDetails = {
    id: 'saas-1',
    name: 'SaaS App',
    type: 'software',
    status: 'active',
    totalRevenue: 12000,
    totalCosts: 2000,
    netProfit: 10000,
    metrics: [
        { name: 'MRR', value: 1000 },
        { name: 'Active Users', value: 500 }
    ]
};

describe('SoftwareProjectRow', () => {
    it('renders basic details, financials, and specialized SaaS metrics', () => {
        render(<SoftwareProjectRow project={mockSoftwareProject} />);

        expect(screen.getByText('SaaS App')).toBeInTheDocument();

        // Assert Financials
        expect(screen.getByText('$12,000')).toBeInTheDocument();

        // Assert SaaS metrics
        expect(screen.getByText('MRR')).toBeInTheDocument();
        expect(screen.getByText('$1,000')).toBeInTheDocument();

        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
    });
});
