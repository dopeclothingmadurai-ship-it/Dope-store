import { type Enums, type Tables } from "@/types/database";

export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type OrderEvent = Tables<"order_events">;

export type OrderStatus = Enums<"order_status">;
export type PaymentStatus = Enums<"payment_status">;
export type FulfillmentStatus = Enums<"fulfillment_status">;

export type OrderSort = "placed_at" | "grand_total" | "order_number" | "status";

export type OrderListItem = Order & { itemCount: number };

export type OrderFilters = {
  status: OrderStatus | null;
  paymentStatus: PaymentStatus | null;
};

export type OrderListResult = {
  items: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  sort: OrderSort;
  dir: "asc" | "desc";
  filters: OrderFilters;
};

export type OrderStats = {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenue: number;
  averageOrderValue: number;
};

export type OrderDetail = Order & {
  items: OrderItem[];
  events: OrderEvent[];
};

/** A snapshotted postal address stored on an order. */
export type OrderAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  phone?: string;
};
