export interface SocialMetrics {
    subscribers?: number;
    views?: number;
    videos?: number;
    stars?: number;
    forks?: number;
    downloads?: number;
    weeklyDownloads?: number;
}

export interface MetricsProvider {
    /**
     * The name of the platform (e.g. 'youtube', 'tiktok')
     */
    readonly platformName: string;

    /**
     * Fetch social metrics for a specific account ID or username
     * @param platformAccountId The unique identifier for the account
     * @returns Normalized domain representation of the platform's metrics
     */
    getMetrics(platformAccountId: string): Promise<SocialMetrics>;
}
