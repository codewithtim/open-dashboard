import { render, screen } from '@testing-library/react';
import { AgentCommitFeed } from '../agent-commit-feed';
import { AgentCommit } from '@/lib/data-client';
import React from 'react';

describe('AgentCommitFeed', () => {
    it('renders commits with agent name, sha link, and repo', () => {
        const commits: AgentCommit[] = [
            {
                id: 1,
                agentId: 'agent-1',
                repoFullName: 'owner/repo',
                sha: 'a1b2c3d4e5f6a7b8',
                message: 'feat: add new feature\n\nsome details',
                author: 'Operator',
                timestamp: '2025-01-16T06:30:00Z',
                htmlUrl: 'https://github.com/owner/repo/commit/a1b2c3d',
                agentName: 'Operator',
            },
        ];

        render(<AgentCommitFeed commits={commits} />);

        expect(screen.getByText('Agent Commits')).toBeInTheDocument();
        expect(screen.getByText('feat: add new feature')).toBeInTheDocument();
        expect(screen.getByText('a1b2c3d')).toBeInTheDocument();
        expect(screen.getByText('Operator')).toBeInTheDocument();
        expect(screen.getByText('owner/repo')).toBeInTheDocument();
    });

    it('shows empty state when no commits', () => {
        render(<AgentCommitFeed commits={[]} />);
        expect(screen.getByText('No agent commits yet.')).toBeInTheDocument();
    });
});
