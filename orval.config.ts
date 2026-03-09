import { defineConfig } from 'orval';

export default defineConfig({
    agentApi: {
        input: './docs/openapi.yaml',
        output: {
            mode: 'single',
            target: './src/lib/api/generated/agent-api.ts',
            client: 'zod',
        },
    },
});
