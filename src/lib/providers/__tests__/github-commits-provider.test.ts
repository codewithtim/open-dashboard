import { GitHubCommitsProvider } from '../github-commits-provider';

describe('GitHubCommitsProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        global.fetch = jest.fn();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('fetches commits within a time window', async () => {
        const mockCommits = [
            {
                sha: 'abc123',
                commit: {
                    message: 'feat: add feature',
                    author: { name: 'Tim', date: '2025-01-15T15:00:00Z' },
                },
                author: { login: 'timknight' },
                html_url: 'https://github.com/owner/repo/commit/abc123',
            },
        ];

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockCommits,
        });

        const provider = new GitHubCommitsProvider();
        const commits = await provider.getCommitsInWindow(
            'owner/repo',
            '2025-01-15T14:00:00Z',
            '2025-01-15T17:00:00Z',
        );

        expect(commits).toHaveLength(1);
        expect(commits[0]).toEqual({
            sha: 'abc123',
            message: 'feat: add feature',
            author: 'Tim',
            timestamp: '2025-01-15T15:00:00Z',
            htmlUrl: 'https://github.com/owner/repo/commit/abc123',
        });

        expect(fetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/owner/repo/commits?since=2025-01-15T14:00:00Z&until=2025-01-15T17:00:00Z&per_page=100',
            { headers: { 'Accept': 'application/vnd.github.v3+json' } },
        );
    });

    it('includes Authorization header when GITHUB_TOKEN is set', async () => {
        process.env.GITHUB_TOKEN = 'ghp_test';

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        const provider = new GitHubCommitsProvider();
        await provider.getCommitsInWindow('owner/repo', '2025-01-01T00:00:00Z', '2025-01-02T00:00:00Z');

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': 'Bearer ghp_test',
                },
            },
        );
    });

    it('returns empty array for empty repo (409)', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 409,
        });

        const provider = new GitHubCommitsProvider();
        const commits = await provider.getCommitsInWindow('owner/empty-repo', '2025-01-01T00:00:00Z', '2025-01-02T00:00:00Z');

        expect(commits).toHaveLength(0);
    });

    it('throws on non-409 errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500,
        });

        const provider = new GitHubCommitsProvider();
        await expect(
            provider.getCommitsInWindow('owner/repo', '2025-01-01T00:00:00Z', '2025-01-02T00:00:00Z'),
        ).rejects.toThrow('GitHub API returned 500');
    });

    it('returns empty array when no commits in window', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        const provider = new GitHubCommitsProvider();
        const commits = await provider.getCommitsInWindow('owner/repo', '2025-01-01T00:00:00Z', '2025-01-02T00:00:00Z');

        expect(commits).toHaveLength(0);
    });
});
