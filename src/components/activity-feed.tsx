import { GitCommitHorizontal, Radio, RadioTower, Heart, Repeat2, MessageCircle } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import {
    ActivityEvent,
    ActivityEventCommitPayload,
    ActivityEventTweetPayload,
    ActivityEventStreamPayload,
} from '@/lib/data-client';

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CommitRow({ payload, projectName }: { payload: ActivityEventCommitPayload; projectName?: string }) {
    if (payload.isPrivate) {
        return (
            <div className="min-w-0 flex-1">
                <p className="text-white text-sm truncate">commit to private repository</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    {projectName && <span>{projectName}</span>}
                </div>
            </div>
        );
    }

    const firstLine = payload.message.split('\n')[0];
    return (
        <div className="min-w-0 flex-1">
            <p className="text-white text-sm truncate">{firstLine}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <a
                    href={payload.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-accent/70 hover:text-accent"
                >
                    {payload.sha.slice(0, 7)}
                </a>
                {projectName && <span>{projectName}</span>}
                {payload.repo && <span className="text-slate-600">{payload.repo}</span>}
            </div>
        </div>
    );
}

function TweetRow({ payload }: { payload: ActivityEventTweetPayload }) {
    return (
        <div className="min-w-0 flex-1">
            <p className="text-white text-sm line-clamp-2">{payload.text}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{payload.likeCount}</span>
                <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" />{payload.retweetCount}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{payload.replyCount}</span>
            </div>
        </div>
    );
}

function StreamRow({ payload, type }: { payload: ActivityEventStreamPayload; type: 'stream_start' | 'stream_end' }) {
    const label = type === 'stream_start' ? 'Went live' : 'Stream ended';
    return (
        <div className="min-w-0 flex-1">
            <p className="text-white text-sm truncate">
                <span className="text-slate-400">{label}:</span> {payload.streamName}
            </p>
            {type === 'stream_end' && payload.viewCount !== undefined && (
                <p className="text-xs text-slate-500 mt-0.5">{payload.viewCount.toLocaleString()} views</p>
            )}
        </div>
    );
}

function EventIcon({ type }: { type: string }) {
    switch (type) {
        case 'commit':
            return <GitCommitHorizontal className="w-4 h-4 text-emerald-400" />;
        case 'tweet':
            return <FaXTwitter className="w-4 h-4 text-slate-300" />;
        case 'stream_start':
            return <Radio className="w-4 h-4 text-rose-400" />;
        case 'stream_end':
            return <RadioTower className="w-4 h-4 text-slate-400" />;
        default:
            return <GitCommitHorizontal className="w-4 h-4 text-slate-500" />;
    }
}

function EventContent({ event }: { event: ActivityEvent }) {
    switch (event.type) {
        case 'commit':
            return <CommitRow payload={event.payload as ActivityEventCommitPayload} projectName={event.projectName} />;
        case 'tweet':
            return <TweetRow payload={event.payload as ActivityEventTweetPayload} />;
        case 'stream_start':
        case 'stream_end':
            return <StreamRow payload={event.payload as ActivityEventStreamPayload} type={event.type} />;
        default:
            return null;
    }
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
    return (
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
            <h2 className="text-white text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
                {events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                            <EventIcon type={event.type} />
                        </div>
                        <EventContent event={event} />
                        <span className="text-xs text-slate-600 whitespace-nowrap flex-shrink-0 mt-0.5">
                            {timeAgo(event.timestamp)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
