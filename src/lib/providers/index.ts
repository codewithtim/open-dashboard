import { MetricsProvider } from './types';
import { YouTubeMetricsProvider } from './youtube-provider';

export function getMetricsProvider(platform: string): MetricsProvider {
    switch (platform.toLowerCase()) {
        case 'youtube':
            return new YouTubeMetricsProvider();
        // Additional platforms can be added here easily, e.g., 'tiktok': return new TikTokMetricsProvider()
        default:
            throw new Error(`Metrics provider not implemented for platform: ${platform}`);
    }
}
