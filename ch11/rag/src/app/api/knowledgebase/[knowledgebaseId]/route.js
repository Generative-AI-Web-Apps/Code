import { NextResponse } from 'next/server';
import { getKnowledgeBase, deleteKnowledgeBase } from '@/lib/database';

export async function DELETE(request, { params }) {
  try {
    const { knowledgebaseId } = params;
    console.log('Deleting knowledge base with ID:', knowledgebaseId);
    await deleteKnowledgeBase(knowledgebaseId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge base:', error);
    return NextResponse.json({ error: 'Failed to delete knowledge base' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { knowledgebaseId } = params;
    const knowledgeBase = await getKnowledgeBase(knowledgebaseId);

    if (!knowledgeBase) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    return NextResponse.json(knowledgeBase);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 });
  }
}
