import { NextResponse } from 'next/server';
import { createKnowledgeBase, getAllKnowledgeBases } from '@/lib/database';


export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const knowledgeBase = await createKnowledgeBase({
        name,
        description: description || '',
      });

    return NextResponse.json(knowledgeBase);
  } catch (error) {
    console.error('Error creating knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge base' },
      { status: 500 }
    );
  }
}

export async function GET() {
    try {
      const knowledgeBases = await getAllKnowledgeBases();
      return NextResponse.json(knowledgeBases);
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
      return NextResponse.json(
        { error: 'Failed to fetch knowledge bases' },
        { status: 500 }
      );
    }
  }