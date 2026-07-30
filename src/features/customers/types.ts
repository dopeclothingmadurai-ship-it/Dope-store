import { type OrderAddress, type Order } from "@/features/orders/types";
import { type Tables } from "@/types/database";

export type Customer = Tables<"customers">;

export type CustomerSort = "created" | "name";

export type CustomerListItem = Customer & {
  orderCount: number;
  totalSpend: number;
  lastOrderAt: string | null;
};

export type CustomerListResult = {
  items: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
  sort: CustomerSort;
  dir: "asc" | "desc";
};

export type CustomerStats = {
  totalOrders: number;
  totalSpend: number;
  averageOrderValue: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
};

export type CustomerDetail = {
  customer: Customer;
  stats: CustomerStats;
  orders: Order[];
  addresses: OrderAddress[];
};

export type { OrderAddress };
