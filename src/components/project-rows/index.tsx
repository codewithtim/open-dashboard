import { ProjectDetails } from '@/lib/data-client';
import { DefaultProjectRow } from './default-row';
import { YouTubeProjectRow } from './youtube-row';
import { SoftwareProjectRow } from './software-row';

export function renderProjectRow(project: ProjectDetails) {
    switch (project.platform?.toLowerCase()) {
        case 'youtube':
            return <YouTubeProjectRow key={ project.id } project = { project } />;
        case 'software': // could match 'software', 'saas', 'stripe' etc
            return <SoftwareProjectRow key={ project.id } project = { project } />;
        default:
            return <DefaultProjectRow key={ project.id } project = { project } />;
    }
}
