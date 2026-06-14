import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function DELETE(request, { params }) {
  try {
    const segments = await getCollection('segments');
    const { id } = await params;
    
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      objectId = id;
    }
    
    const result = await segments.deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting segment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
