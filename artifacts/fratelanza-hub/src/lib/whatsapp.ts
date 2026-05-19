// Build a wa.me deep-link. Strips non-digits from phone. Defaults to Egypt country code
// if the number looks local (starts with 0 or has 10 digits).
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "20" + digits.slice(1); // Egypt local → +20
  else if (digits.length === 10) digits = "20" + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone: string | null | undefined, message: string): boolean {
  const link = buildWhatsAppLink(phone, message);
  if (!link) return false;
  window.open(link, "_blank", "noopener");
  return true;
}
