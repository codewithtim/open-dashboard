import { render, screen } from '@testing-library/react';
import { YouTubeEmbed } from '../youtube-embed';
import React from 'react';

describe('YouTubeEmbed', () => {
    it('renders an iframe with the correct video URL', () => {
        const { container } = render(<YouTubeEmbed videoId="abc123" title="Test Stream" />);
        const iframe = container.querySelector('iframe');
        expect(iframe).toBeTruthy();
        expect(iframe!.getAttribute('src')).toBe('https://www.youtube.com/embed/abc123');
        expect(iframe!.getAttribute('title')).toBe('Test Stream');
    });

    it('uses default title when none provided', () => {
        const { container } = render(<YouTubeEmbed videoId="xyz" />);
        const iframe = container.querySelector('iframe');
        expect(iframe!.getAttribute('title')).toBe('YouTube video');
    });
});
