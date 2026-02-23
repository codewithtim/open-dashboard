# Local Data Client & Mocking Plan

To support running the dashboard without a live Notion backend, we will introduce a `DataClient` abstraction layer. Depending on an environment variable (e.g., `USE_LOCAL_DATA=true`), the application will either instantiate the `NotionClient` or a `LocalMockClient`.

## 1. The `DataClient` Interface

The interface will dictate the precise standard that any data provider must meet, ensuring the frontend components never need to know *where* the data comes from.

```typescript
// src/lib/data-client.ts

export interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface Metric {
  name: string;
  value: number;
}

export interface ProjectDetails extends Project {
  totalCosts: number;
  totalRevenue: number;
  netProfit: number;
  metrics: Metric[];
}

export interface DashboardStats {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
}

export interface DataClient {
  getProjects(): Promise<Project[]>;
  getAggregatedDashboardStats(): Promise<DashboardStats>;
  getProjectDetails(projectId: string): Promise<ProjectDetails | null>;
}
```

## 2. Instantiation Factory

We will abstract the client creation into a factory so that components can simply import `getDataClient()`.

```typescript
// src/lib/client-factory.ts
import { NotionClient } from './notion-client';
import { LocalMockClient } from './local-mock-client';
import { DataClient } from './data-client';

let clientInstance: DataClient | null = null;

export function getDataClient(): DataClient {
  if (clientInstance) return clientInstance;

  if (process.env.USE_LOCAL_DATA === 'true') {
    clientInstance = new LocalMockClient();
  } else {
    clientInstance = new NotionClient();
  }

  return clientInstance;
}
```

## 3. Local Mock Data (`LocalMockClient`)

The local version of the client will simply resolve Promises instantly with the following mock dataset, designed to realistically preview all visual elements of the dashboard.

```typescript
// src/lib/local-mock-client.ts
import { DataClient, Project, DashboardStats, ProjectDetails } from './data-client';

const mockProjects: Project[] = [
  { id: 'youtube-main', name: 'Main YouTube Channel', type: 'Content', status: 'Active' },
  { id: 'saas-starter', name: 'SaaS Boilerplate', type: 'Software', status: 'Active' },
  { id: 'consulting', name: 'Dev Consulting', type: 'Service', status: 'Active' },
  { id: 'failed-app', name: 'Old Crypto App', type: 'Software', status: 'Archived' },
];

// We only aggregate stats for 'Active' projects
const mockGlobalStats: DashboardStats = {
  totalRevenue: 125000,
  totalCosts: 18400,
  netProfit: 106600
};

const mockProjectDetails: Record<string, ProjectDetails> = {
  'youtube-main': {
    id: 'youtube-main',
    name: 'Main YouTube Channel',
    type: 'Content',
    status: 'Active',
    totalRevenue: 45000,
    totalCosts: 5200,
    netProfit: 39800,
    metrics: [
      { name: 'Subscribers', value: 125000 },
      { name: 'Monthly Views', value: 850000 },
      { name: 'Avg Watch Time (min)', value: 8.5 }
    ]
  },
  'saas-starter': {
    id: 'saas-starter',
    name: 'SaaS Boilerplate',
    type: 'Software',
    status: 'Active',
    totalRevenue: 68000,
    totalCosts: 12000,
    netProfit: 56000,
    metrics: [
      { name: 'MRR', value: 8500 },
      { name: 'Active Users', value: 340 },
      { name: 'Churn Rate %', value: 2.1 }
    ]
  },
  'consulting': {
    id: 'consulting',
    name: 'Dev Consulting',
    type: 'Service',
    status: 'Active',
    totalRevenue: 12000,
    totalCosts: 1200,
    netProfit: 10800,
    metrics: [
      { name: 'Active Clients', value: 3 },
      { name: 'Billable Hours (MTD)', value: 85 }
    ]
  }
};

export class LocalMockClient implements DataClient {
  async getProjects(): Promise<Project[]> {
    // Only return active projects, mimicking Notion behavior
    return mockProjects.filter(p => p.status === 'Active');
  }

  async getAggregatedDashboardStats(): Promise<DashboardStats> {
    return mockGlobalStats;
  }

  async getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
    return mockProjectDetails[projectId] || null;
  }
}
```

## 4. Implementation Todo List

- [ ] Create `src/lib/data-client.ts` containing the shared Types and `DataClient` Interfaces.
- [ ] Rename the existing `src/lib/notion.ts` helper methods (e.g. `getProjects`) into a formally typed `NotionClient implements DataClient` class.
- [ ] Create `src/lib/local-mock-client.ts` implementing `DataClient` with the fake dataset outlined above.
- [ ] Create `src/lib/client-factory.ts` which exposes a `getDataClient()` caching singleton.
- [ ] Update frontend components (`src/app/page.tsx` and `src/app/projects/[id]/page.tsx`) to use the new `getDataClient()` factory instead of direct imports from `notion.ts`.
- [ ] Ensure `.env.local` contains `USE_LOCAL_DATA=true` / `USE_LOCAL_DATA=false`.
- [ ] Verify test suite `src/lib/__tests__/notion.test.ts` still passes when testing the new `NotionClient` class explicitly.

