import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const soundPath = path.join(process.cwd(), 'src', 'mixkit-achievement-bell-600.wav');

export async function GET() {
  try {
    const sound = await readFile(soundPath);
    return new NextResponse(sound, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Notification sound is unavailable' }, { status: 404 });
  }
}
