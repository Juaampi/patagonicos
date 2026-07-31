import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PRODUCT_NAME = 'CAMPERA IMPERMEABLE PERROS GRANDES DOGFACE'

const sampleReviews = [
  {
    authorName: 'Carolina M.',
    authorLocation: 'Cipolletti, Rio Negro',
    title: 'Muy buena calidad',
    comment: 'La tela se nota resistente y no se pasa el agua. A mi ovejero le quedó cómoda para caminar.',
    rating: 5,
    createdAt: new Date('2026-07-30T10:00:00-03:00'),
  },
  {
    authorName: 'Marina S.',
    authorLocation: 'Bahia Blanca, Buenos Aires',
    title: 'Tal cual la publicación',
    comment: 'Muy linda terminación y buen calce. La compré para una perra grandota y resultó súper práctica.',
    rating: 5,
    createdAt: new Date('2026-07-28T11:15:00-03:00'),
  },
  {
    authorName: 'Paula D.',
    authorLocation: 'Trelew, Chubut',
    title: 'Recomendable',
    comment: 'Ideal para lluvia y viento. No es pesada, así que el perro se mueve sin problema.',
    rating: 5,
    createdAt: new Date('2026-07-27T16:40:00-03:00'),
  },
  {
    authorName: 'Silvia R.',
    authorLocation: 'Cordoba capital, Cordoba',
    title: 'Muy linda campera',
    comment: 'El color es igual al de la foto y el material se ve bueno. Llegó bien presentada.',
    rating: 5,
    createdAt: new Date('2026-07-26T09:20:00-03:00'),
  },
  {
    authorName: 'Natalia P.',
    authorLocation: 'San Martin de los Andes, Neuquen',
    title: 'Cumplió perfecto',
    comment: 'La usamos en días de nieve y llovizna. Abriga lo justo y sobre todo protege de la humedad.',
    rating: 5,
    createdAt: new Date('2026-07-24T14:05:00-03:00'),
  },
  {
    authorName: 'Jimena A.',
    authorLocation: 'Rada Tilly, Chubut',
    title: 'Le quedó bárbara',
    comment: 'Tengo una labradora grandota y el talle fue correcto. Muy conforme con la compra.',
    rating: 5,
    createdAt: new Date('2026-07-23T12:10:00-03:00'),
  },
  {
    authorName: 'Claudia V.',
    authorLocation: 'General Roca, Rio Negro',
    title: 'Excelente confección',
    comment: 'Se nota bien cosida y firme. Para paseos con frío húmedo viene genial.',
    rating: 5,
    createdAt: new Date('2026-07-22T18:00:00-03:00'),
  },
  {
    authorName: 'Soledad N.',
    authorLocation: 'Santa Rosa, La Pampa',
    title: 'Muy canchera',
    comment: 'Queda hermosa puesta y además es útil. Mi perro se adaptó enseguida y no le molestó para nada.',
    rating: 5,
    createdAt: new Date('2026-07-20T15:45:00-03:00'),
  },
  {
    authorName: 'Rocio T.',
    authorLocation: 'Comodoro Rivadavia, Chubut',
    title: 'Buen producto',
    comment: 'Nos gustó mucho la tela exterior. Para perros grandes cuesta conseguir algo así y esta salió muy bien.',
    rating: 5,
    createdAt: new Date('2026-07-19T13:25:00-03:00'),
  },
  {
    authorName: 'Daniela L.',
    authorLocation: 'Villa Carlos Paz, Cordoba',
    title: 'Queda muy bien',
    comment: 'La campera es liviana, fácil de poner y se seca rápido. Muy buena opción para días feos.',
    rating: 5,
    createdAt: new Date('2026-07-18T17:35:00-03:00'),
  },
  {
    authorName: 'Gabriela C.',
    authorLocation: 'Rio Gallegos, Santa Cruz',
    title: 'Muy práctica',
    comment: 'Protege bastante del viento y de la lluvia. A mi perro le resultó cómoda desde el primer uso.',
    rating: 5,
    createdAt: new Date('2026-07-17T11:50:00-03:00'),
  },
  {
    authorName: 'Eliana H.',
    authorLocation: 'Mendoza capital, Mendoza',
    title: 'Hermosa y funcional',
    comment: 'Me sorprendió para bien. Tiene buena caída y no se siente rígida como otras camperas impermeables.',
    rating: 5,
    createdAt: new Date('2026-07-16T10:35:00-03:00'),
  },
  {
    authorName: 'Luciana B.',
    authorLocation: 'Bariloche, Rio Negro',
    title: 'Muy conforme',
    comment: 'La compré por el clima de acá y rindió bárbaro. Es más linda en persona que en la foto.',
    rating: 5,
    createdAt: new Date('2026-07-15T19:10:00-03:00'),
  },
  {
    authorName: 'Micaela G.',
    authorLocation: 'Mar del Plata, Buenos Aires',
    title: 'Buena compra',
    comment: 'Buen material y talle correcto. Mi perro está cómodo y no se moja el lomo cuando salimos.',
    rating: 5,
    createdAt: new Date('2026-07-14T09:55:00-03:00'),
  },
  {
    authorName: 'Andrea K.',
    authorLocation: 'Ushuaia, Tierra del Fuego',
    title: 'Muy útil',
    comment: 'La usamos para caminatas largas. Cubre bien y resiste el clima sin problema.',
    rating: 5,
    createdAt: new Date('2026-07-13T12:30:00-03:00'),
  },
  {
    authorName: 'Vanesa O.',
    authorLocation: 'Neuquen capital, Neuquen',
    title: 'Linda prenda',
    comment: 'Es más para proteger de lluvia y viento que para mucho abrigo, justo lo que necesitaba.',
    rating: 5,
    createdAt: new Date('2026-07-12T18:25:00-03:00'),
  },
  {
    authorName: 'Fernanda I.',
    authorLocation: 'San Justo, Buenos Aires',
    title: 'Muy buen calce',
    comment: 'Tengo un mestizo grande y le quedó excelente. Se ajusta bien y no se corre al caminar.',
    rating: 5,
    createdAt: new Date('2026-07-11T16:05:00-03:00'),
  },
  {
    authorName: 'Lorena E.',
    authorLocation: 'Villa Maria, Cordoba',
    title: 'De buen material',
    comment: 'Se nota resistente y prolija. Llegó rápido y era tal cual esperaba.',
    rating: 5,
    createdAt: new Date('2026-07-10T14:20:00-03:00'),
  },
  {
    authorName: 'Pamela J.',
    authorLocation: 'Rawson, Chubut',
    title: 'Quedó perfecta',
    comment: 'A mi perro le quedó muy bien del pecho y el largo. Buenísima para los días húmedos.',
    rating: 5,
    createdAt: new Date('2026-07-09T10:15:00-03:00'),
  },
  {
    authorName: 'Noelia U.',
    authorLocation: 'La Plata, Buenos Aires',
    title: 'Muy recomendable',
    comment: 'Compré guiándome por la tabla y acerté. La calidad general es muy buena.',
    rating: 5,
    createdAt: new Date('2026-07-08T13:50:00-03:00'),
  },
  {
    authorName: 'Tamara Q.',
    authorLocation: 'San Rafael, Mendoza',
    title: 'Cómoda para ellos',
    comment: 'No limita el movimiento y eso para mí era clave. Mi perra la usa sin intentar sacársela.',
    rating: 5,
    createdAt: new Date('2026-07-07T17:40:00-03:00'),
  },
  {
    authorName: 'Alicia Z.',
    authorLocation: 'Puerto Madryn, Chubut',
    title: 'Muy linda',
    comment: 'Está bien terminada y el color es hermoso. Se ve fuerte para el uso diario.',
    rating: 5,
    createdAt: new Date('2026-07-06T11:10:00-03:00'),
  },
  {
    authorName: 'Belen Y.',
    authorLocation: 'Olavarria, Buenos Aires',
    title: 'Satisfecha',
    comment: 'Buena relación entre calidad y precio. La volvería a comprar.',
    rating: 5,
    createdAt: new Date('2026-07-05T15:00:00-03:00'),
  },
]

async function main() {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ name: PRODUCT_NAME }, { slug: 'para-frio-extremo-lluvia' }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  })

  if (!product) {
    throw new Error(`No encontré el producto "${PRODUCT_NAME}".`)
  }

  await prisma.productReview.deleteMany({
    where: {
      productId: product.id,
      customerId: null,
      orderId: null,
      authorName: {
        in: sampleReviews.map((review) => review.authorName),
      },
    },
  })

  await prisma.productReview.createMany({
    data: sampleReviews.map((review) => ({
      productId: product.id,
      authorName: review.authorName,
      authorLocation: review.authorLocation,
      title: review.title,
      comment: review.comment,
      rating: review.rating,
      approved: true,
      purchased: true,
      createdAt: review.createdAt,
      updatedAt: review.createdAt,
    })),
  })

  console.log(`Se cargaron ${sampleReviews.length} reseñas de ejemplo en ${product.name} (${product.slug}).`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
