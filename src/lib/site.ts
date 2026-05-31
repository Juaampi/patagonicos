export const siteConfig = {
  name: "LG Leonor Granados Negocios Inmobiliarios",
  shortName: "LG Leonor Granados",
  phoneDisplay: "+54 11 7104-2806",
  phoneLink: "541171042806",
  whatsappMessage:
    "Hola Leonor, quiero consultar por una propiedad de LG Leonor Granados Negocios Inmobiliarios.",
  address: "Av. San Martín 161, Tristán Suárez, Partido de Ezeiza, Buenos Aires, Argentina",
  license: "Matrícula 4551 CPMCLZ",
  mapEmbed:
    "https://www.google.com/maps?q=Av.%20San%20Mart%C3%ADn%20161%2C%20Trist%C3%A1n%20Su%C3%A1rez%2C%20Buenos%20Aires&output=embed",
  email: "contacto@leonorgranados.com",
  socialHandle: "@leonorgranados.inmobiliaria",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

export const navigation = [
  { label: "Inicio", href: "/" },
  { label: "Propiedades", href: "/propiedades" },
  { label: "Venta", href: "/propiedades?operationType=SALE" },
  { label: "Alquiler", href: "/propiedades?operationType=RENT" },
  { label: "Nosotros", href: "/#nosotros" },
  { label: "Contacto", href: "/#contacto" },
];

export const operationLabels = {
  SALE: "Venta",
  RENT: "Alquiler",
} as const;

export const propertyTypeLabels = {
  HOUSE: "Casa",
  APARTMENT: "Departamento",
  LAND: "Lote",
  COMMERCIAL: "Local",
  OFFICE: "Oficina",
  COUNTRY_HOUSE: "Casaquinta",
  WAREHOUSE: "Galpón",
} as const;

export const propertyStatusLabels = {
  AVAILABLE: "Disponible",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  RENTED: "Alquilado",
  DRAFT: "Borrador",
} as const;
