# LG Leonor Granados Negocios Inmobiliarios

Plataforma inmobiliaria premium construida con `Next.js`, `TypeScript`, `TailwindCSS`, `Prisma`, `Neon PostgreSQL` y `Cloudinary`.

## Stack

- Next.js App Router
- React 19
- TailwindCSS 4
- Prisma ORM
- Neon PostgreSQL
- Cloudinary para imágenes
- Autenticación con cookies seguras + `jose`
- Panel admin integrado
- Deploy listo para Netlify

## Funcionalidades incluidas

- Home premium con hero, buscador, destacados, nosotros, testimonios y contacto
- Catálogo dinámico de propiedades
- Página de detalle por propiedad con slider, video opcional, mapa y consulta
- SEO dinámico con metadata, Open Graph, `sitemap.xml` y `robots.txt`
- Panel admin con:
  - login seguro
  - dashboard
  - listado de propiedades
  - alta y edición de propiedades
  - cambio de estado
  - eliminación
  - listado de consultas
  - listado de usuarios admin
- Prisma schema completo para:
  - propiedades
  - imágenes
  - consultas
  - usuarios administradores
  - banners

## Variables de entorno

Copiá `.env.example` a `.env` y completá:

```bash
DATABASE_URL=""
DIRECT_URL=""
AUTH_SECRET=""
NEXT_PUBLIC_SITE_URL=""
SEED_ADMIN_EMAIL=""
SEED_ADMIN_PASSWORD=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

## Desarrollo

```bash
npm install
npm run dev
```

## Prisma

Generar cliente:

```bash
npm run prisma:generate
```

Migrar:

```bash
npm run prisma:migrate
```

Seed inicial:

```bash
npm run seed
```

## Usuario inicial sugerido

Se crea desde el seed:

- Email: `admin@leonorgranados.com`
- Password: `LGAdmin1234!`

Podés cambiarlo desde variables de entorno.

## Deploy en Netlify

El proyecto incluye `netlify.toml` y usa `@netlify/plugin-nextjs`.

Configurar en Netlify:

- Build command: `npm run build`
- Publish directory: `.next`
- Variables de entorno: las mismas de `.env`

## Notas

- Si `DATABASE_URL` no está configurada, el frontend muestra propiedades demo para visualizar el diseño.
- El guardado real en el panel admin requiere Neon PostgreSQL activo.
- Las imágenes ya se pueden subir a Cloudinary desde el panel admin una vez completadas las variables de entorno.
