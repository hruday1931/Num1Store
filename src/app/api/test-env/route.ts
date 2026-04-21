import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== ENVIRONMENT TEST ===');
  
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'SET' : 'MISSING',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
  };
  
  console.log('Environment variables status:', envVars);
  
  // Test Razorpay key format (show first few chars if set)
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  
  const razorpayInfo = {
    keyIdSet: !!razorpayKeyId,
    keyIdLength: razorpayKeyId?.length || 0,
    keyIdPrefix: razorpayKeyId?.substring(0, 8) || 'N/A',
    secretSet: !!razorpaySecret,
    secretLength: razorpaySecret?.length || 0,
  };
  
  console.log('Razorpay info:', razorpayInfo);
  
  return NextResponse.json({
    success: true,
    envVars,
    razorpayInfo
  });
}
