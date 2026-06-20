import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import './globals.css'
import { CartProvider } from '@/components/cart/cart-provider'
import { FloatingActions } from '@/components/layout/floating-actions'
import { NavigationFeedback } from '@/components/layout/navigation-feedback'
import { SiteFooterShell } from '@/components/layout/site-footer-shell'
import { SiteHeaderShell } from '@/components/layout/site-header-shell'
import { ThemeSync } from '@/components/layout/theme-sync'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Patagónicos | Abrigo outdoor para animales en Bariloche',
  description:
    'Marca premium de indumentaria outdoor para animales en Bariloche. Camperas, abrigo técnico y protección real para frío, nieve, viento y humedad.',
}

const GOOGLE_TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID || 'G-KZNYV9TE96'
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${grotesk.variable}`}>
      <body suppressHydrationWarning className="min-h-screen bg-background font-sans text-foreground">
        <CartProvider>
          <ThemeSync />
          <div className="page-wrap min-h-screen">
            <Suspense fallback={null}>
              <NavigationFeedback />
            </Suspense>
            <SiteHeaderShell />
            <main className="pt-[94px] md:pt-[108px]">{children}</main>
            <SiteFooterShell />
            <FloatingActions />
          </div>
        </CartProvider>
        {META_PIXEL_ID ? (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        ) : null}
      </body>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_TAG_ID}');
        `}
      </Script>
      {META_PIXEL_ID ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
    </html>
  )
}
