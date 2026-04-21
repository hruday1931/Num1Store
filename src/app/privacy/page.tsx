import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function PrivacyPolicy() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="min-h-screen bg-red-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-black mb-4">Privacy Policy</h1>
            <p className="text-gray-600">Last Updated: {currentDate}</p>
          </div>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to Num1Store. We respect your privacy and are committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, store, and protect your information when you use 
              our e-commerce marketplace platform.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using Num1Store, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          {/* Information Collection */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-black mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li><strong>Name:</strong> Your full name for account creation and order processing</li>
              <li><strong>Email Address:</strong> For account verification, order confirmations, and communications</li>
              <li><strong>Phone Number:</strong> For delivery coordination and order updates</li>
              <li><strong>Shipping Address:</strong> For product delivery and logistics</li>
              <li><strong>Billing Address:</strong> For payment processing</li>
            </ul>

            <h3 className="text-xl font-semibold text-black mb-3">Account Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li>Username and password for account access</li>
              <li>Profile preferences and settings</li>
              <li>Order history and wishlist items</li>
            </ul>

            <h3 className="text-xl font-semibold text-black mb-3">Technical Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent on our platform</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">How We Use Your Information</h2>
            
            <h3 className="text-xl font-semibold text-black mb-3">Order Processing</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li>Process and confirm your orders</li>
              <li>Arrange for product delivery</li>
              <li>Handle payment transactions</li>
              <li>Send order status updates</li>
            </ul>

            <h3 className="text-xl font-semibold text-black mb-3">Communication</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li>Send order confirmations and shipping notifications</li>
              <li>Respond to your inquiries and customer support requests</li>
              <li>Send promotional offers and marketing communications (with your consent)</li>
              <li>Provide important updates about our services</li>
            </ul>

            <h3 className="text-xl font-semibold text-black mb-3">Platform Improvement</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Analyze usage patterns to improve our services</li>
              <li>Personalize your shopping experience</li>
              <li>Prevent fraudulent activities and ensure platform security</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Encryption:</strong> All sensitive data is encrypted using SSL/TLS protocols</li>
              <li><strong>Secure Servers:</strong> Your information is stored on secure, protected servers</li>
              <li><strong>Access Control:</strong> Only authorized personnel can access your personal data</li>
              <li><strong>Regular Updates:</strong> We continuously update our security systems</li>
              <li><strong>Compliance:</strong> We comply with applicable data protection regulations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              However, no method of transmission over the internet is 100% secure. While we strive to protect 
              your data, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your experience on Num1Store:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Essential Cookies:</strong> Required for basic site functionality</li>
              <li><strong>Performance Cookies:</strong> Help us understand how our site is used</li>
              <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Marketing Cookies:</strong> Show relevant advertisements (with your consent)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You can control cookie settings through your browser preferences. However, disabling certain 
              cookies may affect your experience on our platform.
            </p>
          </section>

          {/* Third-party Services */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Third-party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We work with trusted third-party service providers to deliver our services:
            </p>
            
            <h3 className="text-xl font-semibold text-black mb-3">Delivery Services</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Shiprocket:</strong> We use Shiprocket and their partner delivery services to process 
              and deliver your orders. Your shipping address and contact information are shared with delivery 
              partners solely for the purpose of completing your order.
            </p>

            <h3 className="text-xl font-semibold text-black mb-3">Payment Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We partner with secure payment gateway providers to process your payments. Your payment 
              information is encrypted and processed according to PCI DSS standards. We do not store your 
              complete payment details on our servers.
            </p>

            <h3 className="text-xl font-semibold text-black mb-3">Other Services</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Email service providers for communications</li>
              <li>Analytics services for website improvement</li>
              <li>Customer support platforms for assistance</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to processing of your data</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information only as long as necessary to fulfill the purposes 
              for which it was collected, including legal, accounting, or reporting requirements. 
              You can request deletion of your account and associated data at any time.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Num1Store is not intended for children under 18 years of age. We do not knowingly 
              collect personal information from children under 18. If we become aware that we have 
              collected such information, we will take steps to delete it promptly.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any 
              changes by posting the new Privacy Policy on this page and updating the "Last Updated" 
              date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or how we handle your personal 
              information, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> privacy@num1store.com
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Phone:</strong> +91-XXXXXXXXXX
              </p>
              <p className="text-gray-700">
                <strong>Address:</strong> Num1Store Headquarters, [Your Address], [City], [State] - [Pin Code], India
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
