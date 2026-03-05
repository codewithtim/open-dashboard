import { render, screen } from '@testing-library/react';
import { Header } from '../header';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}));

describe('Header', () => {
    beforeEach(() => {
        (usePathname as jest.Mock).mockReturnValue('/');
    });

    it('renders branding', () => {
        render(<Header />);
        expect(screen.getByText('Tim Knight')).toBeInTheDocument();
        expect(screen.getByText('Blog')).toBeInTheDocument();
    });
});
