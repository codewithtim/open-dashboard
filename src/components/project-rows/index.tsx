import { ProjectDetails } from '@/lib/data-client';
import { DefaultProjectRow } from './default-row';
import { YouTubeProjectRow } from './youtube-row';
import { SoftwareProjectRow } from './software-row';
import { TwitterProjectRow } from './twitter-row';
import { TikTokProjectRow } from './tiktok-row';
import { TwitchProjectRow } from './twitch-row';

export function renderProjectRow(project: ProjectDetails) {
    switch (project.platform?.toLowerCase()) {
        case 'youtube':
            return <YouTubeProjectRow key={project.id} project={project} />;
        case 'software': // could match 'software', 'saas', 'stripe' etc
            return <SoftwareProjectRow key={project.id} project={project} />;
        case 'twitter':
        case 'x':
            return <TwitterProjectRow key={project.id} project={project} />;
        case 'tiktok':
            return <TikTokProjectRow key={project.id} project={project} />;
        case 'twitch':
            return <TwitchProjectRow key={project.id} project={project} />;
        default:
            return <DefaultProjectRow key={project.id} project={project} />;
    }
}
