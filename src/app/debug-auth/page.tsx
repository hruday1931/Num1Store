"use client";

import { useEffect, useState } from 'react';
import { debugClientAuth, checkServerAuth } from '@/utils/debug-auth';

export default function DebugAuthPage() {
  const [clientAuth, setClientAuth] = useState<any>(null);
  const [serverAuth, setServerAuth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Starting authentication debug...');
        
        // Check client-side auth
        const clientData = await debugClientAuth();
        setClientAuth(clientData);
        
        // Check server-side auth
        const serverData = await checkServerAuth();
        setServerAuth(serverData);
        
      } catch (error) {
        console.error('Debug auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Debugging Authentication...</h1>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client-side Auth */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Client-side Auth</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(clientAuth, null, 2)}
            </pre>
          </div>
          
          {/* Server-side Auth */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-600">Server-side Auth</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(serverAuth, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">If client has session but server doesn't:</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li>Check if cookies are being sent with requests</li>
                <li>Verify cookie domain and path settings</li>
                <li>Check for CORS issues</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium">If neither has session:</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li>User needs to sign in</li>
                <li>Session may have expired</li>
                <li>Check Supabase configuration</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <a 
            href="/auth/signin" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
