import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../progress-bar';
import React from 'react';

describe('ProgressBar', () => {
    it('renders the current and target values correctly formatted', () => {
        render(<ProgressBar currentValue={500000} targetValue={1000000} />);
        expect(screen.getByText('$500,000')).toBeInTheDocument();
        expect(screen.getByText('Goal: $1,000,000')).toBeInTheDocument();
    });

    it('calculates the exact 50% width correctly', () => {
        render(<ProgressBar currentValue={500000} targetValue={1000000} />);
        const filler = screen.getByTestId('progress-filler');
        expect(filler).toHaveStyle('width: 50%');
    });

    it('caps the visual width at 100% when revenue exceeds the target', () => {
        render(<ProgressBar currentValue={1500000} targetValue={1000000} />);
        const filler = screen.getByTestId('progress-filler');
        expect(filler).toHaveStyle('width: 100%');
        expect(screen.getByText('$1,500,000')).toBeInTheDocument();
    });

    it('defaults out to a $1,000,000 target base if targetValue is omitted', () => {
        render(<ProgressBar currentValue={250000} />);
        expect(screen.getByText('$250,000')).toBeInTheDocument();
        expect(screen.getByText('Goal: $1,000,000')).toBeInTheDocument();
    });
});
