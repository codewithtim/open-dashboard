import { NpmMetricsProvider } from '../npm-provider';

describe('NpmMetricsProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };

        // Mock global fetch
        global.fetch = jest.fn();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should implement the MetricsProvider interface', () => {
        const provider = new NpmMetricsProvider();
        expect(provider.platformName).toBe('npm');
        expect(typeof provider.getMetrics).toBe('function');
    });

    it('should fetch download stats and normalize them to SocialMetrics', async () => {
        (global.fetch as jest.Mock).mockImplementation((url: string) => {
            if (url.includes('last-month')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ downloads: 50000 }),
                });
            }
            if (url.includes('last-week')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ downloads: 12000 }),
                });
            }
            return Promise.reject(new Error('Unexpected URL'));
        });

        const provider = new NpmMetricsProvider();
        const metrics = await provider.getMetrics('my-package');

        expect(fetch).toHaveBeenCalledWith(
            'https://api.npmjs.org/downloads/point/last-month/my-package'
        );
        expect(fetch).toHaveBeenCalledWith(
            'https://api.npmjs.org/downloads/point/last-week/my-package'
        );

        expect(metrics).toEqual({
            downloads: 50000,
            weeklyDownloads: 12000,
        });
    });

    it('should throw an error if the monthly endpoint fails', async () => {
        (global.fetch as jest.Mock).mockImplementation((url: string) => {
            if (url.includes('last-month')) {
                return Promise.resolve({ ok: false, status: 404 });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ downloads: 100 }),
            });
        });

        const provider = new NpmMetricsProvider();
        await expect(provider.getMetrics('nonexistent-package')).rejects.toThrow('npm API returned 404');
    });

    it('should throw an error if the weekly endpoint fails', async () => {
        (global.fetch as jest.Mock).mockImplementation((url: string) => {
            if (url.includes('last-week')) {
                return Promise.resolve({ ok: false, status: 500 });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ downloads: 100 }),
            });
        });

        const provider = new NpmMetricsProvider();
        await expect(provider.getMetrics('some-package')).rejects.toThrow('npm API returned 500');
    });
});
