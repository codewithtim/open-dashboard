import { render, screen } from '@testing-library/react';
import { ProjectTag } from '../project-tag';
import { Project } from '@/lib/data-client';
import React from 'react';

function makeProject(overrides: Partial<Project> = {}): Project {
    return {
        id: 'proj-1',
        name: 'Test Project',
        type: 'software',
        status: 'active',
        ...overrides,
    };
}

describe('ProjectTag', () => {
    it('renders project name', () => {
        render(<ProjectTag project={makeProject({ name: 'My App' })} />);
        expect(screen.getByText('My App')).toBeInTheDocument();
    });

    it('renders YouTube icon for youtube platform', () => {
        const { container } = render(
            <ProjectTag project={makeProject({ platform: 'youtube', name: 'YT Channel' })} />
        );
        expect(screen.getByText('YT Channel')).toBeInTheDocument();
        // SVG icon should be present
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders GitHub icon for github platform', () => {
        const { container } = render(
            <ProjectTag project={makeProject({ platform: 'github', name: 'My Repo' })} />
        );
        expect(screen.getByText('My Repo')).toBeInTheDocument();
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders npm icon for npm platform', () => {
        const { container } = render(
            <ProjectTag project={makeProject({ platform: 'npm', name: 'my-pkg' })} />
        );
        expect(screen.getByText('my-pkg')).toBeInTheDocument();
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders fallback icon when no platform set', () => {
        const { container } = render(
            <ProjectTag project={makeProject({ platform: undefined, name: 'Generic' })} />
        );
        expect(screen.getByText('Generic')).toBeInTheDocument();
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
