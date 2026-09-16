import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const ablyPath = require.resolve('ably');
    const minJsPath = path.resolve(ablyPath, '../../build/ably.min.js');
    const content = fs.readFileSync(minJsPath, 'utf8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    return new NextResponse('console.error("Failed to load Ably SDK")', { status: 500 });
  }
}
