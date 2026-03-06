import { linkCostToProjects } from '../cost-linker';
import { ProjectService } from '../expense-types';

const services: ProjectService[] = [
    { id: '1', projectId: 'proj-a', vendor: 'Vercel', exclusive: true },
    { id: '2', projectId: 'proj-a', vendor: 'GitHub', exclusive: false },
    { id: '3', projectId: 'proj-b', vendor: 'GitHub', exclusive: false },
    { id: '4', projectId: 'proj-c', vendor: 'AWS', exclusive: false },
];

describe('linkCostToProjects', () => {
    it('returns 100% allocation for a single exclusive match', () => {
        const result = linkCostToProjects('Vercel', services);
        expect(result).toEqual([{ projectId: 'proj-a', allocation: 1 }]);
    });

    it('splits equally among non-exclusive matches', () => {
        const result = linkCostToProjects('GitHub', services);
        expect(result).toEqual([
            { projectId: 'proj-a', allocation: 0.5 },
            { projectId: 'proj-b', allocation: 0.5 },
        ]);
    });

    it('returns empty array when no vendor matches', () => {
        const result = linkCostToProjects('Stripe', services);
        expect(result).toEqual([]);
    });

    it('matches vendors case-insensitively', () => {
        const result = linkCostToProjects('vercel', services);
        expect(result).toEqual([{ projectId: 'proj-a', allocation: 1 }]);

        const result2 = linkCostToProjects('GITHUB', services);
        expect(result2).toHaveLength(2);
    });

    it('treats multiple exclusive entries as equal split', () => {
        const multiExclusive: ProjectService[] = [
            { id: '10', projectId: 'proj-x', vendor: 'Vercel', exclusive: true },
            { id: '11', projectId: 'proj-y', vendor: 'Vercel', exclusive: true },
        ];
        const result = linkCostToProjects('Vercel', multiExclusive);
        expect(result).toEqual([
            { projectId: 'proj-x', allocation: 0.5 },
            { projectId: 'proj-y', allocation: 0.5 },
        ]);
    });

    it('filters to only the matching vendor', () => {
        const result = linkCostToProjects('AWS', services);
        expect(result).toEqual([{ projectId: 'proj-c', allocation: 1 }]);
    });
});
