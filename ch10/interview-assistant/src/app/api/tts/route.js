import { isTTSEnabled } from '@/features/text-to-speach';
import { stripMarkdown } from '@/lib/strip-markdown';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { NextResponse } from 'next/server';

const ttsClient = new TextToSpeechClient({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req) {
  try {
    // Check feature flag
    if (!isTTSEnabled(false)) {
      return new NextResponse(JSON.stringify({ error: 'Text-to-speech feature is disabled' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Invalid text parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanText = stripMarkdown(text);
    if (!cleanText.trim()) {
      return new NextResponse(JSON.stringify({ error: 'No text content after processing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.debug('Text-to-speech request:', cleanText); 
    const ttsRequest = {
      input: { text: cleanText },
      // Select the language and SSML voice gender
      voice: {
        languageCode: 'en-US',
        ssmlGender: 'FEMALE',
        name: 'en-US-Neural2-F',
      },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await ttsClient.synthesizeSpeech(ttsRequest);
    const audioContent = response.audioContent;

    return new NextResponse(audioContent, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate speech' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
