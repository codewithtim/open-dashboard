import { render, screen } from '@testing-library/react';
import { AgentActivityFeed } from '../agent-activity-feed';
import type { AgentCommit, AgentActivity } from '@/lib/data-client';
import React from 'react';

describe('AgentActivityFeed', () => {
    it('renders commits and activities intermingled by timestamp', () => {
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

        const activities: AgentActivity[] = [
            {
                id: 1,
                agentId: 'agent-1',
                action: 'orchestrator_run',
                description: 'Started scheduled orchestrator run',
                timestamp: '2025-01-16T06:25:00Z',
                agentName: 'Operator',
            },
        ];

        render(<AgentActivityFeed commits={commits} activities={activities} />);

        expect(screen.getByText('Agent Activity')).toBeInTheDocument();
        expect(screen.getByText('feat: add new feature')).toBeInTheDocument();
        expect(screen.getByText('a1b2c3d')).toBeInTheDocument();
        expect(screen.getByText('Started scheduled orchestrator run')).toBeInTheDocument();
        expect(screen.getByText('orchestrator_run')).toBeInTheDocument();
    });

    it('shows empty state when no commits or activities', () => {
        render(<AgentActivityFeed commits={[]} activities={[]} />);
        expect(screen.getByText('No agent activity yet.')).toBeInTheDocument();
    });

    it('renders only commits when no activities exist', () => {
        const commits: AgentCommit[] = [
            {
                id: 1,
                agentId: 'agent-1',
                repoFullName: 'owner/repo',
                sha: 'a1b2c3d4e5f6a7b8',
                message: 'fix: bug fix',
                author: 'Operator',
                timestamp: '2025-01-16T06:30:00Z',
                htmlUrl: 'https://github.com/owner/repo/commit/a1b2c3d',
                agentName: 'Operator',
            },
        ];

        render(<AgentActivityFeed commits={commits} activities={[]} />);
        expect(screen.getByText('fix: bug fix')).toBeInTheDocument();
    });

    it('renders only activities when no commits exist', () => {
        const activities: AgentActivity[] = [
            {
                id: 1,
                agentId: 'agent-1',
                action: 'code_review',
                description: 'Reviewed PR #42',
                timestamp: '2025-01-16T06:25:00Z',
                agentName: 'Operator',
            },
        ];

        render(<AgentActivityFeed commits={[]} activities={activities} />);
        expect(screen.getByText('Reviewed PR #42')).toBeInTheDocument();
    });
});
