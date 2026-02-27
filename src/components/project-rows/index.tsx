import Image from 'next/image';
import { ProjectDetails } from '@/lib/data-client';
import { DefaultProjectRow } from './default-row';
import { YouTubeProjectRow } from './youtube-row';
import { SoftwareProjectRow } from './software-row';
import { TwitterProjectRow } from './twitter-row';
import { TikTokProjectRow } from './tiktok-row';
import { TwitchProjectRow } from './twitch-row';
import { InstagramProjectRow } from './instagram-row';
import { GithubProjectRow } from './github-row';
import { NpmProjectRow } from './npm-row';

const PROJECT_ICONS: Record<string, React.ReactNode> = {
    'Workflow Pilot': <Image src="/logo.png" alt="Workflow Pilot" width={24} height={24} className="object-contain" />,
    'TalkyTexty': <Image src="/talkytexty-logo.png" alt="TalkyTexty" width={24} height={24} className="object-contain" />,
};

export function renderProjectRow(project: ProjectDetails) {
    switch (project.platform?.toLowerCase()) {
        case 'youtube':
            return <YouTubeProjectRow key={project.id} project={project} />;
        case 'npm':
            return <NpmProjectRow key={project.id} project={project} icon={PROJECT_ICONS[project.name]} />;
        case 'product':
        case 'software':
        case 'saas':
            return <SoftwareProjectRow key={project.id} project={project} icon={PROJECT_ICONS[project.name]} />;
        case 'twitter':
        case 'x':
            return <TwitterProjectRow key={project.id} project={project} />;
        case 'tiktok':
            return <TikTokProjectRow key={project.id} project={project} />;
        case 'twitch':
            return <TwitchProjectRow key={project.id} project={project} />;
        case 'instagram':
        case 'ig':
            return <InstagramProjectRow key={project.id} project={project} />;
        case 'github':
            return <GithubProjectRow key={project.id} project={project} icon={PROJECT_ICONS[project.name]} />;
        default:
            return <DefaultProjectRow key={project.id} project={project} />;
    }
}
