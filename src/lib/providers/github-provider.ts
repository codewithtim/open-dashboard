import { SocialMetrics, MetricsProvider } from './types';

export class GitHubMetricsProvider implements MetricsProvider {
    readonly platformName = 'github';

    async getMetrics(platformAccountId: string): Promise<SocialMetrics> {
        const url = `https://api.github.com/repos/${platformAccountId}`;
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
        };

        const token = process.env.GITHUB_TOKEN;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers });

        if (!res.ok) {
            throw new Error(`GitHub API returned ${res.status}`);
        }

        const data = await res.json();

        return {
            stars: data.stargazers_count,
            forks: data.forks_count,
        };
    }
}
