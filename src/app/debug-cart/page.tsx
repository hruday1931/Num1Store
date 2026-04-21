'use client';

import { useState, useEffect } from 'react';
import { useAuth, useCart } from '@/contexts';
import { supabaseClient } from '@/utils/supabase/client';

export default function DebugCartPage() {
  const { user, session } = useAuth();
  const { cartItems, loading } = useCart();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const supabase = supabaseClient();

  useEffect(() => {
    const runDebug = async () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        auth: {
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          hasSession: !!session,
          sessionId: session?.user?.id,
          sessionExpiresAt: session?.expires_at,
          currentTime: Math.floor(Date.now() / 1000)
        },
        cart: {
          loading,
          itemsCount: cartItems.length,
          items: cartItems.map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            user_id: item.user_id,
            hasProduct: !!item.products,
            productName: item.products?.name,
            productPrice: item.products?.price
          }))
        }
      };

      // Test direct Supabase query
      if (user) {
        try {
          const { data, error } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', user.id);

          info.directQuery = {
            success: !error,
            data,
            error: error?.message,
            dataCount: data?.length || 0
          };

          // Test count query
          const { count, error: countError } = await supabase
            .from('cart')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          info.countQuery = {
            success: !countError,
            count,
            error: countError?.message
          };

        } catch (err: any) {
          info.directQuery = {
            success: false,
            error: err.message
          };
        }
      }

      setDebugInfo(info);
    };

    runDebug();
  }, [user, session, cartItems, loading]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cart Debug Information</h1>
        
        <div className="space-y-6">
          {/* Authentication Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Authentication Status</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.auth, null, 2)}
            </pre>
          </div>

          {/* Cart Context Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-600">Cart Context</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.cart, null, 2)}
            </pre>
          </div>

          {/* Direct Query Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">Direct Supabase Query</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.directQuery, null, 2)}
            </pre>
          </div>

          {/* Count Query Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-orange-600">Count Query</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo.countQuery, null, 2)}
            </pre>
          </div>

          {/* Full Debug Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Full Debug Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
