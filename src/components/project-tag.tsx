import { Project } from '@/lib/data-client';
import { FaYoutube, FaNpm, FaTiktok, FaTwitch } from 'react-icons/fa6';
import { FaGithub, FaLaptopCode } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { FaInstagram } from 'react-icons/fa6';

function getPlatformIcon(platform?: string) {
    switch (platform) {
        case 'youtube':
            return <FaYoutube className="w-3 h-3 text-[#FF0000]" />;
        case 'github':
            return <FaGithub className="w-3 h-3 text-white" />;
        case 'npm':
            return <FaNpm className="w-3 h-3 text-[#CB3837]" />;
        case 'twitter':
        case 'x':
            return <FaXTwitter className="w-3 h-3 text-white" />;
        case 'instagram':
        case 'ig':
            return <FaInstagram className="w-3 h-3 text-[#E4405F]" />;
        case 'tiktok':
            return <FaTiktok className="w-3 h-3 text-white" />;
        case 'twitch':
            return <FaTwitch className="w-3 h-3 text-[#9146FF]" />;
        default:
            return <FaLaptopCode className="w-3 h-3 text-slate-400" />;
    }
}

interface ProjectTagProps {
    project: Project;
    active?: boolean;
}

export function ProjectTag({ project, active = false }: ProjectTagProps) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            active
                ? 'bg-accent text-surface'
                : 'bg-white/[0.05] text-slate-300'
        }`}>
            {getPlatformIcon(project.platform)}
            {project.name}
        </span>
    );
}
