import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import SoldCustomer from '@/models/SoldCustomer';
import Activity from '@/models/Activity';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string; // Aadhaar, PAN, Agreement, Receipt, Image, PDF

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const cleanFileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadsDir, cleanFileName);

    await fs.writeFile(filePath, buffer);
    const fileUrl = `/uploads/${cleanFileName}`;

    await connectDB();

    let soldCustomer = await SoldCustomer.findOne({ customerId: id, userId: session.user.id });
    if (!soldCustomer) {
      return NextResponse.json(
        { error: 'Before uploading documents, the customer must be registered as a Sold Customer.' }, 
        { status: 400 }
      );
    }

    const docObject = {
      name: file.name,
      url: fileUrl,
      fileType: fileType || 'PDF',
      uploadedAt: new Date()
    };

    soldCustomer.documents.push(docObject);
    await soldCustomer.save();

    await Activity.create({
      userId: session.user.id,
      customerId: id,
      type: 'Document Uploaded',
      description: `Uploaded document: "${file.name}" of type ${fileType || 'PDF'}.`
    });

    return NextResponse.json({ 
      success: true, 
      document: docObject,
      soldCustomer 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
