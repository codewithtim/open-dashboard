import { getDataClient } from '../client-factory';
import { NotionClient } from '../notion-client';
import { LocalMockClient } from '../local-mock-client';

jest.mock('../notion-client', () => {
    return {
        NotionClient: jest.fn().mockImplementation(() => ({
            type: 'notion'
        }))
    };
});

jest.mock('../local-mock-client', () => {
    return {
        LocalMockClient: jest.fn().mockImplementation(() => ({
            type: 'local'
        }))
    };
});

describe('Client Factory', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('returns LocalMockClient when USE_LOCAL_DATA is true', () => {
        process.env.USE_LOCAL_DATA = 'true';
        const { getDataClient, _resetCache } = require('../client-factory');
        _resetCache();

        const client = getDataClient() as any;
        expect(client.type).toBe('local');
    });

    it('returns NotionClient when USE_LOCAL_DATA is false or undefined', () => {
        delete process.env.USE_LOCAL_DATA;
        const { getDataClient, _resetCache } = require('../client-factory');
        _resetCache();

        const client = getDataClient() as any;
        expect(client.type).toBe('notion');
    });

    it('caches the client instance', () => {
        process.env.USE_LOCAL_DATA = 'true';
        const { getDataClient, _resetCache } = require('../client-factory');
        _resetCache();

        const client1 = getDataClient();
        const client2 = getDataClient();
        expect(client1).toBe(client2);
    });
});
