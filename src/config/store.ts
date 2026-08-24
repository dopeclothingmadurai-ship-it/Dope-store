/**
 * Central store configuration. Replace these values later — every surface
 * (footer, contact page, pickup, emails, SEO) reads from here, so one edit
 * updates the whole site. No secrets belong in this file.
 */
export const storeConfig = {
  name: "Dope Store",
  tagline: "Considered clothing for the confident.",

  email: "dopeclothingmadurai@gmail.com",
  phone: "8754431324",
  phoneHref: "tel:8754431324",
  whatsappNumber: "918754431324",

  // TODO: replace `line1` with the exact street address once confirmed.
  address: {
    line1: "Dope Store Flagship",
    city: "Madurai",
    state: "Tamil Nadu",
    pincode: "625001",
    country: "India",
  },

  hours: "Mon–Sat, 11:00 AM – 8:00 PM",

  // Google Maps embed src. City-level Madurai by default (keyless embed) —
  // replace with the exact store's "Embed a map" src when available. Leave
  // empty to fall back to the styled "Visit us" placeholder.
  mapsEmbedSrc: "https://www.google.com/maps?q=Madurai,Tamil+Nadu&output=embed",

  social: {
    instagram: "https://instagram.com/dopestore",
    facebook: "https://facebook.com/dopestore",
    whatsapp: "https://wa.me/918754431324",
  },
} as const;

/** One-line formatted store address. */
export function formatStoreAddress(): string {
  const a = storeConfig.address;
  return `${storeConfig.name}, ${a.line1}, ${a.city}, ${a.state} ${a.pincode}, ${a.country}`;
}
