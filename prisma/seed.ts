import "dotenv/config";
import { PrismaClient, OperationType, PropertyStatus, PropertyType, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "LGAdmin1234!", 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || "admin@leonorgranados.com" },
    update: {
      fullName: "Leonor Granados",
      passwordHash,
      role: UserRole.SUPERADMIN,
    },
    create: {
      fullName: "Leonor Granados",
      email: process.env.SEED_ADMIN_EMAIL || "admin@leonorgranados.com",
      passwordHash,
      role: UserRole.SUPERADMIN,
    },
  });

  const properties = [
    {
      title: "Casa premium con parque en Tristán Suárez",
      seoSlug: "casa-premium-tristan-suarez",
      description:
        "Propiedad de categoría con diseño contemporáneo, amplios espacios sociales, excelente luz natural y terminaciones de alta calidad.",
      price: "245000",
      operationType: OperationType.SALE,
      propertyType: PropertyType.HOUSE,
      address: "Av. San Martín 161",
      city: "Tristán Suárez",
      province: "Buenos Aires",
      latitude: "-34.8724312",
      longitude: "-58.5465932",
      rooms: 5,
      bedrooms: 3,
      bathrooms: 3,
      garage: 2,
      coveredArea: 210,
      totalArea: 450,
      featured: true,
      status: PropertyStatus.AVAILABLE,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      images: [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      title: "Departamento moderno para alquiler en Ezeiza",
      seoSlug: "departamento-moderno-alquiler-ezeiza",
      description:
        "Unidad funcional con estilo contemporáneo, balcón, cocina integrada y ubicación estratégica para una vida práctica y conectada.",
      price: "950000",
      operationType: OperationType.RENT,
      propertyType: PropertyType.APARTMENT,
      address: "Centro urbano de Ezeiza",
      city: "Ezeiza",
      province: "Buenos Aires",
      latitude: "-34.855557",
      longitude: "-58.523472",
      rooms: 3,
      bedrooms: 2,
      bathrooms: 2,
      garage: 1,
      coveredArea: 82,
      totalArea: 94,
      featured: true,
      status: PropertyStatus.AVAILABLE,
      videoUrl: null,
      images: [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      title: "Lote ideal para desarrollo residencial",
      seoSlug: "lote-desarrollo-residencial-ezeiza",
      description:
        "Terreno con excelente frente, entorno consolidado y gran potencial para desarrollo o inversión patrimonial.",
      price: "68000",
      operationType: OperationType.SALE,
      propertyType: PropertyType.LAND,
      address: "Zona residencial en expansión",
      city: "Tristán Suárez",
      province: "Buenos Aires",
      latitude: "-34.878100",
      longitude: "-58.542100",
      rooms: null,
      bedrooms: null,
      bathrooms: null,
      garage: null,
      coveredArea: null,
      totalArea: 620,
      featured: false,
      status: PropertyStatus.AVAILABLE,
      videoUrl: null,
      images: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ];

  for (const property of properties) {
    await prisma.property.upsert({
      where: { seoSlug: property.seoSlug },
      update: {
        ...property,
        images: {
          deleteMany: {},
          create: property.images.map((url, index) => ({
            url,
            alt: property.title,
            sortOrder: index,
            isFeatured: index === 0,
          })),
        },
      },
      create: {
        title: property.title,
        seoSlug: property.seoSlug,
        description: property.description,
        price: property.price,
        operationType: property.operationType,
        propertyType: property.propertyType,
        address: property.address,
        city: property.city,
        province: property.province,
        latitude: property.latitude,
        longitude: property.longitude,
        rooms: property.rooms,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        garage: property.garage,
        coveredArea: property.coveredArea,
        totalArea: property.totalArea,
        featured: property.featured,
        status: property.status,
        videoUrl: property.videoUrl,
        authorId: admin.id,
        images: {
          create: property.images.map((url, index) => ({
            url,
            alt: property.title,
            sortOrder: index,
            isFeatured: index === 0,
          })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
