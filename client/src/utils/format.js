export const formatPrice = (value) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export const formatDateTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

export const isNewArrival = (createdAt) => {
  if (!createdAt) return false;
  const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return days <= 14;
};
