import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('=== HANDLER CALLED ===');
  console.log('Method:', req.method);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('x-upload-secret:', req.headers['x-upload-secret']);
  console.log('x-filename:', req.headers['x-filename']);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-upload-secret'];
  if (secret !== process.env.UPLOAD_SECRET) {
    console.log('Unauthorized - secret mismatch');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const filename = req.headers['x-filename'];

    if (!filename) {
      return res.status(400).json({ error: 'No filename' });
    }

    console.log('Reading body as stream...');

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    console.log('File buffer length:', fileBuffer.length);
    console.log('Filename:', filename);

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'No file data' });
    }

    console.log('Uploading to Vercel Blob...');
    const blob = await put(
      `images/${Date.now()}-${filename}`,
      fileBuffer,
      { access: 'public' }
    );

    console.log('Upload successful:', blob.url);
    res.json({ url: blob.url });
  } catch (e) {
    console.error('Error in handler:', e);
    console.error('Error stack:', e.stack);
    res.status(500).json({ error: 'Upload failed', details: e.message });
  }
}