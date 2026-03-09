import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

let cachedSpec: object | null = null;

export async function GET() {
    if (!cachedSpec) {
        const filePath = join(process.cwd(), 'docs', 'openapi.yaml');
        const content = readFileSync(filePath, 'utf-8');
        cachedSpec = parse(content);
    }
    return NextResponse.json(cachedSpec);
}
