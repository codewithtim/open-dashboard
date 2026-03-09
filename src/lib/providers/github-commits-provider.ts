export interface GitHubCommitData {
    sha: string;
    message: string;
    author: string;
    timestamp: string;
    htmlUrl: string;
}

export class GitHubCommitsProvider {
    private tokenOverride?: string;

    constructor(tokenOverride?: string) {
        this.tokenOverride = tokenOverride;
    }

    private getToken(): string | undefined {
        return this.tokenOverride ?? process.env.GITHUB_TOKEN;
    }

    async getCommitsInWindow(repoFullName: string, since: string, until: string): Promise<GitHubCommitData[]> {
        const url = `https://api.github.com/repos/${repoFullName}/commits?since=${since}&until=${until}&per_page=100`;
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) {
            if (res.status === 409) return []; // Empty repo
            throw new Error(`GitHub API returned ${res.status}`);
        }

        const data = await res.json();
        return this.mapCommits(data);
    }

    async getRecentCommits(repoFullName: string, since: string): Promise<GitHubCommitData[]> {
        const url = `https://api.github.com/repos/${repoFullName}/commits?since=${since}&per_page=100`;
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) {
            if (res.status === 409) return [];
            throw new Error(`GitHub API returned ${res.status}`);
        }

        const data = await res.json();
        return this.mapCommits(data);
    }

    private mapCommits(data: any[]): GitHubCommitData[] {
        return (data || []).map((item: any) => ({
            sha: item.sha,
            message: item.commit?.message || '',
            author: item.commit?.author?.name || item.author?.login || '',
            timestamp: item.commit?.author?.date || '',
            htmlUrl: item.html_url || '',
        }));
    }
}
