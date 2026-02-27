import { GitHubMetricsProvider } from '../github-provider';

describe('GitHubMetricsProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };

        // Mock global fetch
        global.fetch = jest.fn();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should implement the MetricsProvider interface', () => {
        const provider = new GitHubMetricsProvider();
        expect(provider.platformName).toBe('github');
        expect(typeof provider.getMetrics).toBe('function');
    });

    it('should fetch repo stats and normalize them to SocialMetrics', async () => {
        const mockGitHubResponse = {
            stargazers_count: 1200,
            forks_count: 340,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockGitHubResponse,
        });

        const provider = new GitHubMetricsProvider();
        const metrics = await provider.getMetrics('owner/repo');

        expect(fetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/owner/repo',
            { headers: { 'Accept': 'application/vnd.github.v3+json' } }
        );

        expect(metrics).toEqual({
            stars: 1200,
            forks: 340,
        });
    });

    it('should include Authorization header when GITHUB_TOKEN is set', async () => {
        process.env.GITHUB_TOKEN = 'ghp_test123';

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ stargazers_count: 0, forks_count: 0 }),
        });

        const provider = new GitHubMetricsProvider();
        await provider.getMetrics('owner/repo');

        expect(fetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/owner/repo',
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': 'Bearer ghp_test123',
                },
            }
        );
    });

    it('should throw an error if the GitHub API returns an error', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 404,
        });

        const provider = new GitHubMetricsProvider();
        await expect(provider.getMetrics('owner/nonexistent')).rejects.toThrow('GitHub API returned 404');
    });
});
