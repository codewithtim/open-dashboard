import { render, screen } from '@testing-library/react';
import { DashboardCard } from '../dashboard-card';

describe('DashboardCard', () => {
    it('renders title and value', () => {
        render(<DashboardCard title="Total Revenue" value="$120,000" />);
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('$120,000')).toBeInTheDocument();
    });

    it('renders trend positive correctly', () => {
        render(<DashboardCard title="Test" value="100" trend="+12%" />);
        expect(screen.getByText('+12%')).toBeInTheDocument();
    });

    it('applies featured styling when featured prop is true', () => {
        const { container } = render(<DashboardCard title="Test" value="100" featured />);
        // Check for some distinct featured class, matching plan.md specification
        expect(container.firstChild).toHaveClass('bg-neutral-900');
    });
});
