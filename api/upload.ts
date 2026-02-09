import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

const ALLOWED_IMAGE_TYPES = ['about', 'orders', 'projects'] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-upload-secret'];
  const filename = req.headers['x-filename'];
  const imageType = req.headers['x-image-type'];

  if (secret !== process.env.UPLOAD_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!filename || Array.isArray(filename)) {
    return res.status(400).json({ error: 'No filename' });
  }

  let folder = 'images/other';

  if (imageType && !Array.isArray(imageType)) {
    if (ALLOWED_IMAGE_TYPES.includes(imageType as any)) {
      folder = `images/${imageType}`;
    }
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }

    const fileBuffer = Buffer.concat(chunks);

    if (!fileBuffer.length) {
      return res.status(400).json({ error: 'No file data' });
    }

    const path = `${folder}/${Date.now()}-${filename}`;

    const blob = await put(path, fileBuffer, {
      access: 'public',
    });

    return res.status(200).json({ url: blob.url });
  } catch (e: any) {
    console.error('Upload failed', e);
    return res.status(500).json({
      error: 'Upload failed',
      details: e?.message,
    });
  }
}
