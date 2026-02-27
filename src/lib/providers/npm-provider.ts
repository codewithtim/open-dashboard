import { SocialMetrics, MetricsProvider } from './types';

export class NpmMetricsProvider implements MetricsProvider {
    readonly platformName = 'npm';

    async getMetrics(platformAccountId: string): Promise<SocialMetrics> {
        const [monthlyRes, weeklyRes] = await Promise.all([
            fetch(`https://api.npmjs.org/downloads/point/last-month/${platformAccountId}`),
            fetch(`https://api.npmjs.org/downloads/point/last-week/${platformAccountId}`),
        ]);

        if (!monthlyRes.ok) {
            throw new Error(`npm API returned ${monthlyRes.status}`);
        }
        if (!weeklyRes.ok) {
            throw new Error(`npm API returned ${weeklyRes.status}`);
        }

        const [monthlyData, weeklyData] = await Promise.all([
            monthlyRes.json(),
            weeklyRes.json(),
        ]);

        return {
            downloads: monthlyData.downloads,
            weeklyDownloads: weeklyData.downloads,
        };
    }
}
