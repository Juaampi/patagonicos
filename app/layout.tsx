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

const GOOGLE_TAG_ID = 'G-4H1KEMP4DP'

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
    </html>
  )
}
