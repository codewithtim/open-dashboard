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

// Export for tests
export function _resetCache() {
    clientInstance = null;
}
