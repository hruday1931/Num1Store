import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
    },
    razorpay: {
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'SET' : 'NOT SET',
      keySecret: process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET',
      keyIdPrefix: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 10) + '...',
    },
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
