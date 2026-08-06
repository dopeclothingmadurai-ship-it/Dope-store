/**
 * Shipping charges (pure — shared by the checkout UI and the authoritative
 * server pricing so the displayed total always matches what is charged).
 *
 * Free over ₹2,000 (matches the storefront's free-shipping messaging), else a
 * flat ₹99. Store pickup is always free.
 */
export const FREE_SHIPPING_THRESHOLD = 200000; // ₹2,000 in paise
export const FLAT_SHIPPING = 9900; // ₹99 in paise

export function computeShipping(
  subtotal: number,
  fulfillmentType: "delivery" | "pickup",
): number {
  if (fulfillmentType === "pickup") return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
}
