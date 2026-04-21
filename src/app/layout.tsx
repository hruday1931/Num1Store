import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider, CartProvider, WishlistProvider, ToastProvider } from "@/contexts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Num1Store - Multi-Vendor E-commerce Marketplace",
  description: "Your trusted multi-vendor marketplace connecting quality sellers with discerning customers. Shop thousands of products from verified vendors.",
  manifest: "/manifest.json",
  themeColor: "#ec4899",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Num1Store",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Num1Store",
    title: "Num1Store - Multi-Vendor E-commerce Marketplace",
    description: "Your trusted multi-vendor marketplace connecting quality sellers with discerning customers.",
  },
  twitter: {
    card: "summary",
    title: "Num1Store - Multi-Vendor E-commerce Marketplace",
    description: "Your trusted multi-vendor marketplace connecting quality sellers with discerning customers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <div className="fade-in min-h-full">
                  {children}
                </div>
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
        />
      </body>
    </html>
  );
}
