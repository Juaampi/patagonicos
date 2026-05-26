import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart/cart-provider'
import { FloatingActions } from '@/components/layout/floating-actions'
import { SiteFooterShell } from '@/components/layout/site-footer-shell'
import { SiteHeaderShell } from '@/components/layout/site-header-shell'

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
      <body suppressHydrationWarning className="min-h-screen bg-background font-sans text-foreground">
        <CartProvider>
          <div className="page-wrap min-h-screen">
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
