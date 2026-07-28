/**
 * Money helpers. All monetary values are stored and handled as integer paise;
 * rupees are only ever a display/input convenience at the UI edge.
 */
const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Convert a rupees amount (from a form input) to integer paise. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert integer paise to a rupees number (for form inputs). */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Format integer paise as an INR currency string, e.g. ₹1,999.00. */
export function formatPaise(paise: number): string {
  return INR.format(paise / 100);
}
