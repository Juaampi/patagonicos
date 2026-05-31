# Patitas Andinas 2

Tienda online premium para indumentaria outdoor para perros en Bariloche, con estética sobria blanco/negro, producto técnico y base lista para Netlify.

## Arquitectura

- `app/`: App Router con home, catálogo, producto, carrito, perfil, admin y rutas API.
- `components/`: layout, branding, marketing, producto, checkout, perfil y admin.
- `lib/`: datos demo, helpers de tienda, Prisma, Cloudinary, Mercado Pago, email y auth.
- `prisma/schema.prisma`: modelo de datos para Neon Postgres.
- `netlify.toml`: despliegue preparado con plugin de Next.js para Netlify.

## Stack

- Next.js + React
- Tailwind CSS
- Prisma + Neon Postgres
- Cloudinary
- Mercado Pago preparado
- Emails transaccionales preparados
- Deploy en Netlify

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

```bash
DATABASE_URL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
JWT_SECRET=
MAGIC_LINK_SECRET=
ADMIN_EMAIL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
EMAIL_PROVIDER=console
RESEND_API_KEY=
FROM_EMAIL=
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run prisma:push
npm run prisma:studio
npm run seed
```

## Estado actual

- Home completa con slider, banners, producto estrella, bloque educativo, destacados y entrega en el día.
- Página de productos con grilla premium y filtros visuales.
- Página individual con selector de color que cambia imagen, talles, tabla de medidas y relacionados.
- Carrito/checkout listo para crear orden pendiente.
- Perfil con ingreso por email/magic link preparado.
- Admin básico funcional para productos, órdenes y clientes.
- Cloudinary, Mercado Pago y emails listos para conectar con credenciales reales.
