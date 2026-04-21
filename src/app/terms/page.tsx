import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-xl text-gray-600 mb-2">
            Your agreement with Num1Store
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Terms Content */}
        <div className="grid gap-8">
          
          {/* Introduction */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mr-4">
                <span className="text-red-600 font-bold text-lg">1</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Introduction</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Welcome to <span className="font-semibold text-gray-900">Num1Store</span>. These Terms and Conditions govern your use of our website and services 
                as a multi-vendor marketplace. By accessing or using Num1Store, you agree to be bound by these terms.
              </p>
              <p>
                If you do not agree to these terms, please do not use our website or services. Num1Store reserves 
                the right to modify these terms at any time, and such modifications shall be effective immediately 
                upon posting.
              </p>
            </div>
          </section>

          {/* User Accounts */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mr-4">
                <span className="text-red-600 font-bold text-lg">2</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">User Accounts</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                To access certain features of Num1Store, you must register for an account. When you create an account:
              </p>
              <div className="grid gap-3">
                {[
                  "You must provide accurate, current, and complete information",
                  "You are responsible for maintaining the confidentiality of your account credentials",
                  "You are responsible for all activities that occur under your account",
                  "You must notify us immediately of any unauthorized use of your account",
                  "You must be at least 18 years old to create an account"
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">
                  Num1Store reserves the right to suspend or terminate accounts that violate these terms.
                </p>
              </div>
            </div>
          </section>

          {/* Vendor Rules */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mr-4">
                <span className="text-red-600 font-bold text-lg">3</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Vendor Rules</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Vendors selling on Num1Store must adhere to the following responsibilities:
              </p>
              <div className="grid gap-3">
                {[
                  "List only genuine, legal products that you have the right to sell",
                  "Provide accurate and complete product descriptions and images",
                  "Maintain adequate inventory levels for listed products",
                  "Process orders promptly and provide timely shipping",
                  "Respond to customer inquiries and complaints professionally",
                  "Comply with all applicable laws and regulations",
                  "Not engage in fraudulent, deceptive, or unfair business practices",
                  "Maintain appropriate business licenses and permits"
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">
                  Violation of these rules may result in account suspension, termination, or legal action.
                </p>
              </div>
            </div>
          </section>

          {/* Purchases & Payments */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mr-4">
                <span className="text-red-600 font-bold text-lg">4</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Purchases & Payments</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                When you make purchases through Num1Store:
              </p>
              <div className="grid gap-3">
                {[
                  "All prices are listed in Indian Rupees (§) and are inclusive of applicable taxes",
                  "Payment must be made through our approved payment methods",
                  "Orders are subject to product availability and vendor confirmation",
                  "We reserve the right to refuse or cancel any order for any reason",
                  "Refunds are processed according to our Refund Policy",
                  "Transaction fees may apply for certain payment methods"
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <span className="font-semibold">Note:</span> Num1Store acts as a marketplace facilitator and is not responsible for vendor-specific payment issues.
                </p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mr-4">
                <span className="text-red-600 font-bold text-lg">5</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Intellectual Property</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                All content on Num1Store, including but not limited to:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Logos, trademarks, and brand names",
                  "Website design and layout",
                  "Text, graphics, images, and videos",
                  "Software and code",
                  "Database and proprietary information"
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>
                  are owned by Num1Store or our content suppliers and are protected by intellectual property laws. 
                  You may not use, reproduce, or distribute any of our intellectual property without our prior written consent.
                </p>
                <p>
                  Vendors retain ownership of their product content but grant Num1Store a license to display and market 
                  their products on our platform.
                </p>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mr-4">
                <span className="text-red-600 font-bold text-lg">6</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Limitation of Liability</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                To the fullest extent permitted by law:
              </p>
              <div className="grid gap-3">
                {[
                  "Num1Store is not liable for any indirect, incidental, or consequential damages",
                  "We are not responsible for vendor product quality, shipping delays, or customer service issues",
                  "Our total liability for any claim shall not exceed the amount you paid for the affected product",
                  "We do not guarantee uninterrupted or error-free website operation",
                  "We are not liable for third-party content or links"
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  Some jurisdictions do not allow the exclusion or limitation of liability, so these limitations may not apply to you.
                </p>
              </div>
            </div>
          </section>

          {/* Governing Law */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mr-4">
                <span className="text-red-600 font-bold text-lg">7</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Governing Law</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                These Terms and Conditions shall be governed by and construed in accordance with the laws of India, 
                without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising from or relating to these terms or your use of Num1Store shall be resolved 
                through arbitration in accordance with Indian Arbitration and Conciliation Act, 1996.
              </p>
              <p>
                The courts of Mumbai, India shall have exclusive jurisdiction over any matters arising from these terms.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl shadow-sm border border-red-200 p-8">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-lg mr-4">
                <span className="text-white font-bold text-lg">8</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">support@num1store.com</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">+1 (555) 123-4567</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-gray-900">123 Market St, Commerce City, ST 12345</p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
            Back to Homepage
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
