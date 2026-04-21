'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { supabase } from '@/lib/supabase';

function CheckEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResending(true);
    setResendMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setResendMessage('Confirmation email has been resent successfully!');
    } catch (error: any) {
      setResendMessage(error.message || 'Failed to resend confirmation email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-purple-50">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Email Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-10 w-10 text-green-600" />
              </div>
            </div>
            
            {/* Title and Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Check Your Email
            </h1>
            
            <div className="space-y-4 mb-8">
              <p className="text-gray-600">
                We've sent a confirmation email to:
              </p>
              {email && (
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="font-semibold text-gray-900">{email}</p>
                </div>
              )}
              <p className="text-gray-600 text-sm">
                Click the link in the email to verify your account and start using Num1Store.
              </p>
            </div>

            {/* Resend Section */}
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Didn't receive the email?
              </p>
              
              {resendMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  resendMessage.includes('successfully') 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {resendMessage}
                </div>
              )}
              
              <button
                onClick={handleResendEmail}
                disabled={resending || !email}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Email
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Go to Sign In
              </Link>
              
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign Up
              </Link>
            </div>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>Tip:</strong> Check your spam folder if you don't see the email in your inbox.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-purple-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}
