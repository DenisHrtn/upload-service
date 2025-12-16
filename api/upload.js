import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  console.log('Body length:', req.body?.length);
  console.log('Filename:', req.headers['x-filename']);
  console.log('Secret:', req.headers['x-upload-secret']);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-upload-secret'];
  if (secret !== process.env.UPLOAD_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const file = req.body;
    const filename = req.headers['x-filename'];

    if (!file || !filename) {
      return res.status(400).json({ error: 'No file' });
    }

    const blob = await put(
      `images/${Date.now()}-${filename}`,
      file,
      { access: 'public' }
    );

    res.json({ url: blob.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Upload failed' });
  }
}
