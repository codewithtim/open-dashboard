import { render, screen } from '@testing-library/react';
import { NpmProjectRow } from '../npm-row';
import { ProjectDetails } from '@/lib/data-client';

const mockNpmProject: ProjectDetails = {
    id: 'npm-1',
    name: 'my-awesome-package',
    type: 'software',
    status: 'active',
    platform: 'npm',
    platformAccountId: 'my-awesome-package',
    link: 'https://www.npmjs.com/package/my-awesome-package',
    totalRevenue: 0,
    totalCosts: 10,
    netProfit: -10,
    metrics: [
        { name: 'Downloads', value: 50000 },
        { name: 'Weekly Downloads', value: 12000 }
    ]
};

describe('NpmProjectRow', () => {
    it('renders project basic details and specific npm metrics', () => {
        render(<NpmProjectRow project={mockNpmProject} />);

        expect(screen.getByText('my-awesome-package')).toBeInTheDocument();
        expect(screen.getByText('software')).toBeInTheDocument();

        // Assert Financials
        expect(screen.getByText('$0')).toBeInTheDocument();
        expect(screen.getByText('$-10')).toBeInTheDocument();
        expect(screen.getByText('$10')).toBeInTheDocument(); // Costs

        // Assert npm Stats
        expect(screen.getByText('Downloads')).toBeInTheDocument();
        expect(screen.getByText('50,000')).toBeInTheDocument();
        expect(screen.getByText('Weekly Downloads')).toBeInTheDocument();
        expect(screen.getByText('12,000')).toBeInTheDocument();
    });
});
