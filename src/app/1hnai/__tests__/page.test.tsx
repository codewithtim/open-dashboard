import { render, screen } from '@testing-library/react';
import OneHumanNAIPage from '../page';
import { getDataClient } from '@/lib/client-factory';
import React from 'react';

jest.mock('@/lib/client-factory', () => ({
    getDataClient: jest.fn(),
}));

describe('1H:NAI Page', () => {
    it('renders stats and agent commit feed', async () => {
        const mockClient = {
            getAgents: jest.fn().mockResolvedValue([
                { id: 'agent-1', name: 'Operator', identifier: 'Operator', status: 'working', currentTask: 'Building feature', createdAt: '2025-01-01T00:00:00Z' },
                { id: 'agent-2', name: 'Devin', identifier: 'Devin', status: 'idle', createdAt: '2025-02-01T00:00:00Z' },
            ]),
            getAgentCommits: jest.fn().mockResolvedValue([
                {
                    id: 1,
                    agentId: 'agent-1',
                    repoFullName: 'codewithtim/insider_trading_tracker',
                    sha: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
                    message: 'feat: add SEC Form 4 parser',
                    author: 'Operator',
                    timestamp: '2025-01-16T06:30:00Z',
                    htmlUrl: 'https://github.com/codewithtim/insider_trading_tracker/commit/a1b2c3d',
                    agentName: 'Operator',
                },
                {
                    id: 2,
                    agentId: 'agent-1',
                    repoFullName: 'codewithtim/insider_trading_tracker',
                    sha: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
                    message: 'fix: handle amended filings',
                    author: 'Operator',
                    timestamp: '2025-01-16T04:15:00Z',
                    htmlUrl: 'https://github.com/codewithtim/insider_trading_tracker/commit/b2c3d4e',
                    agentName: 'Operator',
                },
                {
                    id: 3,
                    agentId: 'agent-2',
                    repoFullName: 'codewithtim/other-repo',
                    sha: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
                    message: 'feat: add new endpoint',
                    author: 'Devin',
                    timestamp: '2025-01-15T22:00:00Z',
                    htmlUrl: 'https://github.com/codewithtim/other-repo/commit/c3d4e5f',
                    agentName: 'Devin',
                },
            ]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await OneHumanNAIPage();
        render(page);

        expect(screen.getByText('N AI')).toBeInTheDocument();
        expect(screen.getByText('Agents')).toBeInTheDocument();
        expect(screen.getByText('Commits')).toBeInTheDocument();
        expect(screen.getByText('Repos')).toBeInTheDocument();
        // 2 agents, 3 commits, 2 repos — use getAllByText since '2' appears for both agents and repos
        expect(screen.getAllByText('2')).toHaveLength(2);
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('feat: add SEC Form 4 parser')).toBeInTheDocument();
    });

    it('shows empty state when no commits', async () => {
        const mockClient = {
            getAgents: jest.fn().mockResolvedValue([]),
            getAgentCommits: jest.fn().mockResolvedValue([]),
        };
        (getDataClient as jest.Mock).mockReturnValue(mockClient);

        const page = await OneHumanNAIPage();
        render(page);

        expect(screen.getByText('No agent commits yet.')).toBeInTheDocument();
        expect(screen.getAllByText('0')).toHaveLength(3);
    });
});
