import { NextResponse } from 'next/server';
import { deleteDocument } from '@/lib/database';
import { Index } from '@upstash/vector';

export async function DELETE(request, { params }) {
  const { id, knowledgebaseId } = params;

  if (!id) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  try {
    await deleteDocument(id);
    const upstashIndex = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });
    const deleteResult = await upstashIndex.delete(
      {
        prefix: id,
      },
      { namespace: knowledgebaseId },
    );
    return NextResponse.json(
      {
        success: true,
        message: `Document ${id} and all associated chunks deleted successfully`,
        deletedVectors: deleteResult.deleted,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`Error deleting document ${id}:`, error);

    return NextResponse.json(
      {
        error: 'Failed to delete document',
        message: error.message,
      },
      { status: 500 },
    );
  }
}
