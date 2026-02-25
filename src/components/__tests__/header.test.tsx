import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../header';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';

jest.mock('next-themes', () => ({
    useTheme: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}));

describe('Header', () => {
    beforeEach(() => {
        (usePathname as jest.Mock).mockReturnValue('/');
    });

    it('renders branding', () => {
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light', setTheme: jest.fn() });
        render(<Header />);
        expect(screen.getByText('Tim Knight')).toBeInTheDocument();
        expect(screen.getByText('Blog')).toBeInTheDocument();
    });

    it('toggles theme on button click', () => {
        const setThemeMock = jest.fn();
        (useTheme as jest.Mock).mockReturnValue({ theme: 'light', setTheme: setThemeMock });
        render(<Header />);

        // We expect a button to toggle theme
        const btn = screen.getByRole('button', { name: /toggle theme/i });
        fireEvent.click(btn);
        expect(setThemeMock).toHaveBeenCalledWith('dark');
    });
});
