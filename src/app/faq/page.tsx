'use client';

import { useState } from 'react';
import { Header, Footer } from '@/components';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: 'Orders & Shipping',
    items: [
      {
        question: 'How do I track my order?',
        answer: 'You can track your order by logging into your account and navigating to the "My Orders" section. Click on any order to view its real-time tracking status and estimated delivery date.'
      },
      {
        question: 'How long does delivery take?',
        answer: 'Standard delivery typically takes 5-7 business days. Express delivery takes 2-3 business days. Delivery times may vary based on your location and product availability.'
      },
      {
        question: 'Do you ship internationally?',
        answer: 'Currently, we ship within India only. We are working on expanding our international shipping capabilities and will update our customers as soon as international shipping becomes available.'
      },
      {
        question: 'What are the shipping charges?',
        answer: 'Shipping charges vary based on your location and order value. Orders above §500 qualify for free standard shipping. Express shipping charges are additional and calculated at checkout.'
      }
    ]
  },
  {
    title: 'Payments',
    items: [
      {
        question: 'Is my payment secure?',
        answer: 'Yes, absolutely. We use industry-standard SSL encryption to protect your payment information. All transactions are processed through secure payment gateways that comply with PCI DSS standards.'
      },
      {
        question: 'What payment methods are accepted?',
        answer: 'We accept all major credit/debit cards, UPI, net banking, and popular digital wallets including PayTM, PhonePe, and Google Pay. We also offer Cash on Delivery (COD) for eligible orders.'
      },
      {
        question: 'Can I pay in installments?',
        answer: 'Yes, we offer EMI options on select credit cards for orders above §1000. You can choose the EMI option at checkout and select your preferred tenure (3, 6, 9, or 12 months).'
      },
      {
        question: 'Why was my payment declined?',
        answer: 'Payment declines can occur due to various reasons including insufficient funds, incorrect card details, or bank security measures. Please check your details and try again, or contact your bank for assistance.'
      }
    ]
  },
  {
    title: 'Returns & Refunds',
    items: [
      {
        question: 'What is the return policy?',
        answer: 'We offer a 30-day return policy for most products. Items must be unused, in original packaging, and with all tags attached. Some items like perishables and intimate apparel may have different return policies.'
      },
      {
        question: 'How do I initiate a return?',
        answer: 'Log into your account, go to "My Orders," select the order you want to return, and click on "Return Item." Follow the instructions to schedule a pickup or drop-off at our partner locations.'
      },
      {
        question: 'How do I get a refund?',
        answer: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will be credited to your original payment method. For COD orders, we provide bank transfer options.'
      },
      {
        question: 'Can I exchange an item instead of returning it?',
        answer: 'Yes, you can exchange items for a different size or color of the same product. The exchange option is available during the return initiation process. Price differences, if any, will be adjusted accordingly.'
      }
    ]
  },
  {
    title: 'Account',
    items: [
      {
        question: 'How do I change my password?',
        answer: 'Log into your account and go to "Account Settings." Click on "Security" and select "Change Password." You will need to enter your current password and then set a new one following our security guidelines.'
      },
      {
        question: 'How do I update my personal information?',
        answer: 'Navigate to "Account Settings" and click on "Personal Information." You can update your name, email, phone number, and other details. Don\'t forget to save your changes before leaving the page.'
      },
      {
        question: 'Can I have multiple delivery addresses?',
        answer: 'Yes, you can save multiple delivery addresses in your account. Go to "Address Book" in your account settings to add, edit, or delete addresses. You can select any saved address during checkout.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'If you wish to delete your account, please contact our customer support team at <a href="mailto:support@num1store.com" class="text-blue-600 hover:text-blue-800 underline">support@num1store.com</a>. We will guide you through the process and ensure all your data is permanently removed from our systems.'
      }
    ]
  }
];

export default function FAQPage() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    const newExpanded = new Set(expandedItems);
    
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    
    setExpandedItems(newExpanded);
  };

  return (
    <div className="min-h-screen bg-red-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about shopping on Num1Store
          </p>
        </div>

        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-black">
                  {category.title}
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {category.items.map((item, itemIndex) => {
                  const isExpanded = expandedItems.has(`${categoryIndex}-${itemIndex}`);
                  
                  return (
                    <div key={itemIndex} className="bg-white">
                      <button
                        onClick={() => toggleItem(categoryIndex, itemIndex)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-black pr-4">
                            {item.question}
                          </h3>
                          <div className="flex-shrink-0">
                            <svg
                              className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="px-6 pb-4">
                          <p 
                            className="text-gray-600 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: item.answer }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-black mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-600 mb-6">
            Can't find the answer you're looking for? Our customer support team is here to help.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-150"
          >
            Contact Us
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
