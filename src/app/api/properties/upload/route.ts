import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const runtime = 'nodejs';

type MediaType = 'image' | 'video';

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp']);
const videoExtensions = new Set(['mp4', 'webm', 'mov']);

function getMediaType(file: File): MediaType | null {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (imageExtensions.has(extension) && file.type.startsWith('image/')) return 'image';
  if (videoExtensions.has(extension) && (file.type.startsWith('video/') || extension === 'mov')) return 'video';
  return null;
}

async function uploadToCloudinary(file: File, type: MediaType) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'real-estate-crm/properties';
  const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest('hex');
  const payload = new FormData();
  payload.set('file', file);
  payload.set('api_key', apiKey);
  payload.set('timestamp', String(timestamp));
  payload.set('folder', folder);
  payload.set('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type === 'image' ? 'image' : 'video'}/upload`, {
    method: 'POST',
    body: payload,
  });
  const result = await response.json() as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || `Unable to persist ${type} in media storage`);
  }
  return result.secure_url;
}

async function uploadLocally(file: File) {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const filename = `${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const files = (await request.formData()).getAll('files').filter((value): value is File => value instanceof File);
    if (!files.length) return NextResponse.json({ error: 'No files provided for upload' }, { status: 400 });

    const uploadedMedia = [];
    for (const file of files) {
      const type = getMediaType(file);
      if (!type) return NextResponse.json({ error: `Unsupported file: "${file.name}". Use JPG, JPEG, PNG, WEBP, MP4, WEBM, or MOV.` }, { status: 400 });
      const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) return NextResponse.json({ error: `${type === 'image' ? 'Image' : 'Video'} "${file.name}" exceeds the ${type === 'image' ? '5MB' : '50MB'} size limit.` }, { status: 400 });

      let url: string | null = null;
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        try {
          url = await uploadToCloudinary(file, type);
        } catch (cloudError) {
          console.warn('[Property media upload] Cloudinary upload failed, falling back to local storage:', cloudError);
        }
      }

      if (!url) {
        url = await uploadLocally(file);
      }

      uploadedMedia.push({ type, url });
    }

    return NextResponse.json(uploadedMedia, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error occurred during media upload';
    console.error('[Property media upload]', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
