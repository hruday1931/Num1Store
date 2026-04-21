'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts';
import Link from 'next/link';

export default function AuthDebugPage() {
  const { user, session, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: string[] = [];
      
      try {
        // Test 1: Check Supabase client
        results.push('✅ Supabase client initialized');
        results.push(`📡 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
        
        // Test 2: Check current session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          results.push(`❌ Session error: ${error.message}`);
        } else if (session) {
          results.push(`✅ Active session found for user: ${session.user.email}`);
          results.push(`📅 Session expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
        } else {
          results.push('⚠️ No active session');
        }
        
        // Test 3: Check localStorage
        if (typeof window !== 'undefined') {
          const storageKeys = Object.keys(localStorage).filter(key => key.includes('supabase'));
          results.push(`📦 localStorage keys: ${storageKeys.length} Supabase items`);
          storageKeys.forEach(key => {
            const value = localStorage.getItem(key);
            results.push(`  - ${key}: ${value?.substring(0, 50)}...`);
          });
        }
        
        // Test 4: Check cookies
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';').filter(cookie => cookie.includes('supabase'));
          results.push(`🍪 Cookies: ${cookies.length} Supabase cookies`);
          cookies.forEach(cookie => {
            results.push(`  - ${cookie.trim()}`);
          });
        }
        
        setDebugInfo({
          user,
          session,
          loading,
          envVars: {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
          }
        });
        
      } catch (error: any) {
        results.push(`❌ Diagnostic error: ${error.message}`);
      }
      
      setTestResults(results);
    };

    runDiagnostics();
  }, [user, session, loading]);

  const testSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword'
      });
      
      if (error) {
        alert(`Sign in test failed: ${error.message}`);
      } else {
        alert('Sign in test successful! Check console for details.');
        console.log('Test sign in result:', data);
      }
    } catch (error: any) {
      alert(`Test error: ${error.message}`);
    }
  };

  const clearAuth = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Authentication Debug</h1>
          <p className="text-gray-600">Diagnostic tools for troubleshooting authentication issues</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current State */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Loading:</strong> {loading ? '✅ Yes' : '❌ No'}</div>
              <div><strong>User:</strong> {user ? `✅ ${user.email} (${user.role})` : '❌ None'}</div>
              <div><strong>Session:</strong> {session ? '✅ Active' : '❌ None'}</div>
              {session && (
                <div className="mt-2 p-2 bg-green-50 rounded">
                  <div><strong>User ID:</strong> {session.user.id}</div>
                  <div><strong>Email:</strong> {session.user.email}</div>
                  <div><strong>Expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2 text-sm">
              {debugInfo?.envVars && Object.entries(debugInfo.envVars).map(([key, value]) => (
                <div key={key}>
                  <strong>{key}:</strong> {value as string}
                </div>
              ))}
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
            <div className="space-y-1 text-sm font-mono">
              {testResults.map((result, index) => (
                <div key={index} className="p-1 hover:bg-gray-50 rounded">
                  {result}
                </div>
              ))}
            </div>
          </div>

          {/* Test Actions */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={testSignIn}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Test Sign In (test@example.com)
              </button>
              <button
                onClick={clearAuth}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear Auth Data
              </button>
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 inline-block"
              >
                Go to Sign In
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 inline-block"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Raw Debug Data</h2>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
