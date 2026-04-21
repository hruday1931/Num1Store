'use client';

import { useAuth } from '@/contexts';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts';
import { ShoppingBag, Store, Users, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const {} = useToast();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600 mb-6">
              Please sign in to access your dashboard.
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign In
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Role-based dashboard access
  const getDashboardInfo = () => {
    switch (user.role) {
      case 'customer':
        return {
          title: 'Customer Dashboard',
          description: 'View your orders, wishlist, and account information',
          icon: ShoppingBag,
          href: '/dashboard/customer',
          color: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'seller':
        return {
          title: 'Seller Dashboard',
          description: 'Manage your products, orders, and store settings',
          icon: Store,
          href: '/dashboard/seller',
          color: 'bg-green-600 hover:bg-green-700'
        };
      case 'admin':
        return {
          title: 'Admin Dashboard',
          description: 'Manage users, vendors, and marketplace settings',
          icon: Users,
          href: '/dashboard/admin',
          color: 'bg-purple-600 hover:bg-purple-700'
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Access your personalized dashboard',
          icon: ShoppingBag,
          href: '/dashboard/customer',
          color: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const dashboardInfo = getDashboardInfo();
  const Icon = dashboardInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{dashboardInfo.title}</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {dashboardInfo.description}
          </p>
          
          <div className="space-y-4 max-w-sm mx-auto">
            <Button
              onClick={() => router.push(dashboardInfo.href)}
              className={`w-full ${dashboardInfo.color} text-white`}
            >
              Go to {dashboardInfo.title}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
