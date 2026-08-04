/** A single order as shown in the customer's account history. */
export type AccountOrder = {
  id: string;
  orderNumber: string;
  placedAt: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  grandTotal: number;
  itemCount: number;
};
