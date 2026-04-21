import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArrowLeft, Clock, Package, Shield, AlertCircle, CheckCircle, Phone, Mail, MessageCircle } from 'lucide-react';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-red-50">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Page Header with Gradient Background */}
          <div className="bg-gradient-to-r from-red-100 to-pink-100 p-8 border-b border-red-200">
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 text-red-600 mr-3" />
              <h1 className="text-4xl font-bold" style={{ color: '#000000' }}>Refund and Cancellation Policy</h1>
            </div>
            <p className="text-red-700 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="p-8 space-y-8">
            
            {/* Return Window */}
            <section className="bg-red-50 rounded-xl p-6 border border-red-100">
              <div className="flex items-center mb-4">
                <Clock className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>1. Return Window</h2>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700">
                  At Num1Store, we want you to be completely satisfied with your purchase. We offer a <strong className="text-red-600">7-day return policy</strong> from the date of delivery.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Returns must be initiated within 7 days of receiving your order
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    The return window starts from the actual delivery date, not the shipping date
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Items returned after 7 days will not be eligible for refunds
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Extended return periods may apply during festive seasons (check product page for details)
                  </li>
                </ul>
              </div>
            </section>

            {/* Conditions for Return */}
            <section className="bg-white rounded-xl p-6 border border-red-100 shadow-sm">
              <div className="flex items-center mb-4">
                <Package className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>2. Conditions for Return</h2>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700">
                  To be eligible for a return, please ensure that the product meets the following conditions:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Unused Condition:</strong> Product must be unused, unworn, and in the same condition as received</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Original Packaging:</strong> Item must be returned in its original packaging with all tags intact</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Complete Accessories:</strong> All accessories, manuals, and freebies must be included</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Proof of Purchase:</strong> Original invoice or order confirmation must be provided</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">No Damage:</strong> Product should not be damaged due to customer misuse or negligence</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Sealed Products:</strong> Sealed items (software, cosmetics, food items) must remain unopened</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Refund Process */}
            <section className="bg-red-50 rounded-xl p-6 border border-red-100">
              <div className="flex items-center mb-4">
                <Clock className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>3. Refund Process</h2>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700">
                  Once we receive your returned item, our team will inspect it and process your refund:
                </p>
                <div className="bg-white rounded-lg p-6 border border-red-200 shadow-sm">
                  <ol className="space-y-3">
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                      <span className="text-gray-700">Initiate return request through your account or customer service</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                      <span className="text-gray-700">Pack the item securely in original packaging</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                      <span className="text-gray-700">Ship the item to the address provided by our team</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                      <span className="text-gray-700">Our team inspects the returned item within 2-3 business days</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
                      <span className="text-gray-700">Refund is processed upon successful inspection</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">6</span>
                      <span className="text-gray-700">Refund amount reflects in your account within 5-7 business days</span>
                    </li>
                  </ol>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Refund processing time: <strong className="text-red-600">5-7 business days</strong> after successful inspection
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Refund will be credited to the original payment method
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Shipping charges for returns are borne by the customer unless the item is defective
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    You will receive email notifications at each step of the return process
                  </li>
                </ul>
              </div>
            </section>

            {/* Non-returnable Items */}
            <section className="bg-white rounded-xl p-6 border border-red-100 shadow-sm">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>4. Non-returnable Items</h2>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700">
                  The following items cannot be returned or refunded:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-gray-700">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Customized Products:</strong> Items made to order or personalized products</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Perishable Goods:</strong> Food items, flowers, and other perishable products</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Intangible Items:</strong> Digital downloads, software licenses, and gift cards</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Personal Care Items:</strong> Cosmetics, toiletries, and hygiene products (once opened)</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Undergarments:</strong> Innerwear and intimate apparel for hygiene reasons</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Clearance Items:</strong> Products marked as final sale or clearance</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Used Products:</strong> Items that show signs of wear, use, or damage</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Cancellation Policy */}
            <section className="bg-red-50 rounded-xl p-6 border border-red-100">
              <div className="flex items-center mb-4">
                <Clock className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>5. Cancellation Policy</h2>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700">
                  You can cancel your order under the following conditions:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Before Shipment:</strong> Orders can be cancelled free of charge before they are shipped</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">After Shipment:</strong> Once shipped, orders cannot be cancelled and must follow the return process</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Cancellation Time:</strong> Same-day cancellations processed within 2-4 hours</span>
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-red-600">Refund Timeline:</strong> Cancellation refunds are processed within 3-5 business days</span>
                  </li>
                </ul>
                <div className="bg-red-100 border border-red-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-red-800">
                      <strong>Note:</strong> To cancel an order, please contact our customer service immediately with your order number.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Damaged or Defective Items */}
            <section className="bg-white rounded-xl p-6 border border-red-100 shadow-sm">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>6. Damaged or Defective Items</h2>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700">
                  If you receive a damaged or defective product:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Report the issue within 48 hours of delivery
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Provide photos or videos showing the damage/defect
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    We will arrange for a replacement or full refund
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Return shipping for defective items is free of charge
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Replacement will be processed within 7-10 business days
                  </li>
                </ul>
              </div>
            </section>

            {/* Exchange Policy */}
            <section className="bg-red-50 rounded-xl p-6 border border-red-100">
              <div className="flex items-center mb-4">
                <Package className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>7. Exchange Policy</h2>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700">
                  We offer exchanges for most products under the following conditions:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Exchange requests must be made within 7 days of delivery
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Product must meet all return conditions mentioned above
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Price differences will be adjusted accordingly
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Exchange shipping charges may apply based on vendor policies
                  </li>
                  <li className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Same product exchanges (different size/color) are prioritized
                  </li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-gradient-to-r from-red-100 to-pink-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center mb-4">
                <MessageCircle className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>8. Need Help?</h2>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700">
                  If you have any questions about our refund and cancellation policy, please contact us:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-red-200">
                    <Mail className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-red-900">support@num1store.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-red-200">
                    <Phone className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-red-900">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-red-200">
                    <Clock className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Customer Service Hours</p>
                      <p className="font-semibold text-red-900">Monday to Saturday, 9:00 AM - 6:00 PM IST</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-red-200">
                    <MessageCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Live Chat</p>
                      <p className="font-semibold text-red-900">Available on our website during business hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
