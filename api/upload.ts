import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-upload-secret'];
  const filename = req.headers['x-filename'];

  if (secret !== process.env.UPLOAD_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  if (!filename || Array.isArray(filename)) return res.status(400).json({ error: 'No filename' });

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const fileBuffer = Buffer.concat(chunks);

  if (!fileBuffer.length) return res.status(400).json({ error: 'No file data' });

  const blob = await put(`images/${Date.now()}-${filename}`, fileBuffer, { access: 'public' });
  return res.status(200).json({ url: blob.url });
}
