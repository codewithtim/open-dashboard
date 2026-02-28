import { IconType } from 'react-icons';
import {
    SiNextdotjs,
    SiVercel,
    SiTailwindcss,
    SiNotion,
    SiStripe,
    SiTypescript,
    SiReact,
    SiNodedotjs,
    SiPostgresql,
    SiPrisma,
    SiGithub,
    SiDocker,
    SiFigma,
    SiCloudflare,
    SiSupabase,
} from 'react-icons/si';

const TOOL_ICON_MAP: Record<string, IconType> = {
    SiNextdotjs,
    SiVercel,
    SiTailwindcss,
    SiNotion,
    SiStripe,
    SiTypescript,
    SiReact,
    SiNodedotjs,
    SiPostgresql,
    SiPrisma,
    SiGithub,
    SiDocker,
    SiFigma,
    SiCloudflare,
    SiSupabase,
};

export function getToolIcon(iconKey: string): IconType | null {
    return TOOL_ICON_MAP[iconKey] ?? null;
}
