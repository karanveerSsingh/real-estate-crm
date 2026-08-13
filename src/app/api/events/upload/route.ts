import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const runtime = 'nodejs';

type FileKind = 'image' | 'video' | 'raw';
const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const videoExtensions = new Set(['mp4', 'webm', 'mov']);
const documentExtensions = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']);

function getFileKind(file: File): FileKind | null {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (imageExtensions.has(extension) && file.type.startsWith('image/')) return 'image';
  if (videoExtensions.has(extension) && (file.type.startsWith('video/') || extension === 'mov')) return 'video';
  if (documentExtensions.has(extension)) return 'raw';
  return null;
}

async function uploadFile(file: File, kind: FileKind) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Persistent media storage is not configured');
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'real-estate-crm/events';
  const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest('hex');
  const payload = new FormData();
  payload.set('file', file);
  payload.set('api_key', apiKey);
  payload.set('timestamp', String(timestamp));
  payload.set('folder', folder);
  payload.set('signature', signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${kind}/upload`, { method: 'POST', body: payload });
  const result = await response.json() as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !result.secure_url) throw new Error(result.error?.message || `Unable to upload ${file.name}`);
  return { name: file.name, url: result.secure_url, mimeType: file.type || 'application/octet-stream', size: file.size };
}

export async function POST(request: Request) {
  try {
    if (!await getServerSession(authOptions)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return NextResponse.json({ error: 'Persistent media storage is not configured. Add the Cloudinary environment variables before sharing event media.' }, { status: 503 });
    const files = (await request.formData()).getAll('files').filter((value): value is File => value instanceof File);
    if (!files.length) return NextResponse.json({ error: 'Select at least one file.' }, { status: 400 });
    if (files.length > 10) return NextResponse.json({ error: 'You can share up to 10 files at a time.' }, { status: 400 });
    const uploaded = [];
    for (const file of files) {
      const kind = getFileKind(file);
      if (!kind) return NextResponse.json({ error: `Unsupported file: ${file.name}.` }, { status: 400 });
      const maxSize = kind === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) return NextResponse.json({ error: `${file.name} exceeds the ${kind === 'video' ? '50MB' : '10MB'} limit.` }, { status: 400 });
      uploaded.push(await uploadFile(file, kind));
    }
    return NextResponse.json(uploaded, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to upload event files' }, { status: 500 });
  }
}
