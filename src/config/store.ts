/**
 * Central store configuration. Replace these values later — every surface
 * (footer, contact page, pickup, emails, SEO) reads from here, so one edit
 * updates the whole site. No secrets belong in this file.
 */
export const storeConfig = {
  name: "Dope Store",
  tagline: "Considered clothing for the confident.",

  email: "hello@dopestore.in",
  phone: "+91 90000 00000",
  phoneHref: "tel:+919000000000",
  whatsappNumber: "919000000000",

  address: {
    line1: "12 MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    country: "India",
  },

  hours: "Mon–Sat, 11:00 AM – 8:00 PM",

  // Optional Google Maps embed src (leave empty to hide the map).
  mapsEmbedSrc: "",

  social: {
    instagram: "https://instagram.com/dopestore",
    facebook: "https://facebook.com/dopestore",
    whatsapp: "https://wa.me/919000000000",
  },
} as const;

/** One-line formatted store address. */
export function formatStoreAddress(): string {
  const a = storeConfig.address;
  return `${storeConfig.name}, ${a.line1}, ${a.city}, ${a.state} ${a.pincode}, ${a.country}`;
}
