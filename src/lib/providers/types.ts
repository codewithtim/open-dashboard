export interface SocialMetrics {
    subscribers?: number;
    views?: number;
    videos?: number;
    // We can add generic followers, impressions, etc., later for other platforms
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
