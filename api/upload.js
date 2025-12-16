import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';

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
    console.log('Creating formidable form...');
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
    });

    console.log('Parsing form...');
    const [fields, files] = await form.parse(req);

    console.log('Fields:', fields);
    console.log('Files:', Object.keys(files));
    console.log('File object:', files.file);

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      console.log('No file found');
      return res.status(400).json({ error: 'No file' });
    }

    console.log('File found:', file.originalFilename || file.newFilename);
    const fileBuffer = fs.readFileSync(file.filepath);
    const filename = file.originalFilename || file.newFilename;

    console.log('Uploading to Vercel Blob...');
    const blob = await put(
      `images/${Date.now()}-${filename}`,
      fileBuffer,
      { access: 'public' }
    );

    fs.unlinkSync(file.filepath);
    console.log('Upload successful:', blob.url);

    res.json({ url: blob.url });
  } catch (e) {
    console.error('Error in handler:', e);
    console.error('Error stack:', e.stack);
    res.status(500).json({ error: 'Upload failed', details: e.message });
  }
}