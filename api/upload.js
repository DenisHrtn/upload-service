import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-upload-secret'];
  if (secret !== process.env.UPLOAD_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
    });

    const [fields, files] = await form.parse(req);

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file' });
    }

    const fileBuffer = fs.readFileSync(file.filepath);
    const filename = file.originalFilename || file.newFilename;

    const blob = await put(
      `images/${Date.now()}-${filename}`,
      fileBuffer,
      { access: 'public' }
    );

    fs.unlinkSync(file.filepath);

    res.json({ url: blob.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Upload failed' });
  }
}