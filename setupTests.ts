import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextDecoder, TextEncoder });

global.Request = class Request {
    url: string;
    init: any;
    headers: { get: (name: string) => string | null };
    constructor(url: string, init?: any) {
        this.url = url;
        this.init = init;
        this.headers = {
            get: (name: string) => this.init?.headers?.[name.toLowerCase()] || null
        };
    }
} as any;

global.Response = class Response {
    status: number;
    constructor(public body?: any, init?: any) {
        this.status = init?.status || 200;
    }
    async json() { return this.body; }
    async text() { return this.body; }
} as any;
