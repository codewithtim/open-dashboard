"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectService } from '@/lib/data-client';

interface ProjectServicesEditorProps {
    projectId: string;
    initialServices: ProjectService[];
}

interface ServiceEntry {
    vendor: string;
    exclusive: boolean;
}

export function ProjectServicesEditor({ projectId, initialServices }: ProjectServicesEditorProps) {
    const router = useRouter();
    const [services, setServices] = useState<ServiceEntry[]>(
        initialServices.map(s => ({ vendor: s.vendor, exclusive: s.exclusive }))
    );
    const [newVendor, setNewVendor] = useState('');
    const [saving, setSaving] = useState(false);

    function addService() {
        if (!newVendor.trim()) return;
        setServices([...services, { vendor: newVendor.trim(), exclusive: false }]);
        setNewVendor('');
    }

    function removeService(index: number) {
        setServices(services.filter((_, i) => i !== index));
    }

    function toggleExclusive(index: number) {
        setServices(services.map((s, i) => i === index ? { ...s, exclusive: !s.exclusive } : s));
    }

    async function save() {
        setSaving(true);
        await fetch(`/api/projects/${projectId}/services`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ services }),
        });
        setSaving(false);
        router.refresh();
    }

    return (
        <div className="space-y-3">
            {services.map((svc, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-slate-300 flex-1">{svc.vendor}</span>
                    <button
                        onClick={() => toggleExclusive(i)}
                        className={`text-xs px-2 py-1 rounded ${svc.exclusive ? 'bg-accent/10 text-accent' : 'bg-white/[0.05] text-slate-500'}`}
                    >
                        {svc.exclusive ? 'Exclusive' : 'Shared'}
                    </button>
                    <button
                        onClick={() => removeService(i)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                    >
                        Remove
                    </button>
                </div>
            ))}

            <div className="flex gap-2">
                <input
                    type="text"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addService()}
                    placeholder="Add vendor..."
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-white/[0.05] border border-surface-border text-white placeholder-slate-600 focus:outline-none focus:border-accent"
                />
                <button
                    onClick={addService}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white/[0.05] border border-surface-border text-slate-400 hover:text-accent hover:border-accent transition-colors"
                >
                    Add
                </button>
            </div>

            <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
                {saving ? 'Saving...' : 'Save Services'}
            </button>
        </div>
    );
}
