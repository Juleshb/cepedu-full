export function formatMoney(value) {
  const num = Number(value || 0);
  const formatted = Number.isFinite(num)
    ? num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
  return `Frw ${formatted}`;
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function titleCase(value) {
  if (!value) return "—";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function statusTone(status) {
  switch (status) {
    case "approved":
    case "paid":
    case "completed":
    case "deposit":
      return "good";
    case "pending":
      return "wait";
    case "rejected":
      return "bad";
    case "withdrawal":
      return "out";
    default:
      return "neutral";
  }
}
