import { MetricsProvider } from './types';
import { YouTubeMetricsProvider } from './youtube-provider';
import { GitHubMetricsProvider } from './github-provider';
import { NpmMetricsProvider } from './npm-provider';

export function getMetricsProvider(platform: string): MetricsProvider {
    switch (platform) {
        case 'youtube':
            return new YouTubeMetricsProvider();
        case 'github':
            return new GitHubMetricsProvider();
        case 'npm':
            return new NpmMetricsProvider();
        default:
            throw new Error(`Metrics provider not implemented for platform: ${platform}`);
    }
}
