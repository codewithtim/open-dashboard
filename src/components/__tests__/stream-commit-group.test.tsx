import { render, screen } from '@testing-library/react';
import { StreamCommitGroup } from '../stream-commit-group';
import { StreamCommit } from '@/lib/data-client';
import React from 'react';

const mockCommits: StreamCommit[] = [
    {
        sha: 'abc1234567890',
        message: 'feat: add user auth\n\nDetailed description here',
        author: 'timknight',
        timestamp: '2025-01-15T14:30:00Z',
        htmlUrl: 'https://github.com/owner/repo/commit/abc1234567890',
        repo: 'owner/repo',
        projectId: 'proj-1',
    },
    {
        sha: 'def5678901234',
        message: 'fix: login bug',
        author: 'timknight',
        timestamp: '2025-01-15T15:00:00Z',
        htmlUrl: 'https://github.com/owner/repo/commit/def5678901234',
        repo: 'owner/repo',
        projectId: 'proj-1',
    },
];

describe('StreamCommitGroup', () => {
    it('renders the repo name and commit count', () => {
        render(<StreamCommitGroup repo="owner/repo" commits={mockCommits} />);
        expect(screen.getByText('owner/repo')).toBeInTheDocument();
        expect(screen.getByText('(2 commits)')).toBeInTheDocument();
    });

    it('renders abbreviated SHAs as links', () => {
        render(<StreamCommitGroup repo="owner/repo" commits={mockCommits} />);
        const shaLink = screen.getByText('abc1234');
        expect(shaLink.closest('a')).toHaveAttribute(
            'href',
            'https://github.com/owner/repo/commit/abc1234567890',
        );
    });

    it('shows only the first line of multi-line commit messages', () => {
        render(<StreamCommitGroup repo="owner/repo" commits={mockCommits} />);
        expect(screen.getByText('feat: add user auth')).toBeInTheDocument();
        expect(screen.queryByText('Detailed description here')).not.toBeInTheDocument();
    });

    it('renders singular commit text for single commit', () => {
        render(<StreamCommitGroup repo="owner/repo" commits={[mockCommits[0]]} />);
        expect(screen.getByText('(1 commit)')).toBeInTheDocument();
    });
});
