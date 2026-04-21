import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Users, Truck, Headphones, Award, Globe } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'About Us - Num1Store',
  description: 'Learn about Num1Store - Your trusted multi-vendor marketplace connecting quality sellers with discerning customers.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white mt-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                About <span className="text-yellow-400">Num1Store</span>
              </h1>
              <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
                Your trusted multi-vendor marketplace connecting quality sellers with discerning customers worldwide.
              </p>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-lg text-gray-600 mb-4">
              Founded in 2024, Num1Store emerged from a simple vision: to create a marketplace where quality meets convenience. 
              We noticed a gap in the e-commerce landscape where customers struggled to find verified, quality products from trusted sellers.
            </p>
            <p className="text-lg text-gray-600 mb-4">
              Our platform brings together thousands of verified vendors and millions of customers, creating a seamless shopping experience 
              that prioritizes trust, quality, and customer satisfaction above all else.
            </p>
            <p className="text-lg text-gray-600">
              Today, Num1Store stands as a testament to the power of connecting people through commerce, 
              enabling small businesses to thrive while giving customers access to the products they love.
            </p>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-r from-green-500 to-yellow-400 rounded-2xl p-8 text-white">
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">100K+</div>
                <div className="text-xl">Happy Customers</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-gray-900 rounded-2xl p-6 text-white">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">5000+</div>
                <div className="text-lg">Verified Vendors</div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Trust & Security</h3>
              <p className="text-gray-600">
                Every vendor is verified, every transaction is secure. Your trust is our foundation.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community First</h3>
              <p className="text-gray-600">
                Building a community where sellers thrive and customers find exactly what they need.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Assurance</h3>
              <p className="text-gray-600">
                Rigorous quality checks ensure only the best products make it to our marketplace.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Truck className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Quick and reliable delivery partners ensure your products reach you on time, every time.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Headphones className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Our dedicated support team is always here to help you with any questions or concerns.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Globe className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Global Reach</h3>
              <p className="text-gray-600">
                Connecting local businesses with customers worldwide, breaking geographical barriers.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-gray-900 text-white rounded-2xl p-8 md:p-12 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              To empower small businesses and entrepreneurs by providing them with a platform to reach millions of customers, 
              while offering shoppers a trusted marketplace for quality products.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">Empower</div>
              <p className="text-gray-300">Small businesses to grow and succeed in the digital marketplace</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">Connect</div>
              <p className="text-gray-300">Quality sellers with discerning customers worldwide</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">Innovate</div>
              <p className="text-gray-300">E-commerce solutions that make online shopping better for everyone</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join the Num1Store Community</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Whether you're looking to shop amazing products or grow your business, Num1Store is the perfect platform for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products" 
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Start Shopping
            </Link>
            <Link 
              href="/vendors" 
              className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Become a Vendor
            </Link>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
