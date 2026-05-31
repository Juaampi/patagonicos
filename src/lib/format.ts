export function formatCurrency(value: number | string) {
  const parsed = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed || 0);
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatOperation(operationType: string) {
  return operationType === "RENT" ? "Alquiler" : "Venta";
}
