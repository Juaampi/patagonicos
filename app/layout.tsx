import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${grotesk.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var storedTheme = window.localStorage.getItem('pa2-theme');
                  var theme = storedTheme === 'dark' || storedTheme === 'light'
                    ? storedTheme
                    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.classList.toggle('theme-dark', theme === 'dark');
                  document.documentElement.dataset.theme = theme;
                  document.body && document.body.classList.toggle('theme-dark-body', theme === 'dark');
                } catch (error) {}
              })();
            `,
          }}
        />
      </head>
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
    </html>
  )
}
