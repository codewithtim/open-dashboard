import { CostAllocation, ProjectService } from './expense-types';

export function linkCostToProjects(vendor: string, allServices: ProjectService[]): CostAllocation[] {
    const vendorLower = vendor.toLowerCase();
    const matches = allServices.filter(s => s.vendor.toLowerCase() === vendorLower);

    if (matches.length === 0) return [];

    const allocation = 1 / matches.length;
    return matches.map(s => ({
        projectId: s.projectId,
        allocation,
    }));
}
