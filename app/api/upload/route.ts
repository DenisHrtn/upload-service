// @ts-ignore
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = req.headers.get('x-upload-secret');
  const filename = req.headers.get('x-filename');

  if (secret !== process.env.UPLOAD_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!filename) {
    return NextResponse.json({ error: 'No filename' }, { status: 400 });
  }

  const buffer = Buffer.from(await req.arrayBuffer());
  if (!buffer.length) {
    return NextResponse.json({ error: 'No file data' }, { status: 400 });
  }

  const blob = await put(`images/${Date.now()}-${filename}`, buffer, { access: 'public' });
  return NextResponse.json({ url: blob.url });
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
