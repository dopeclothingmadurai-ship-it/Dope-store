import { type OrderStatus, type PaymentStatus } from "@/features/orders/types";

export type DateRangeKey = "today" | "7d" | "30d" | "90d" | "year" | "custom";

export type ResolvedRange = {
  key: DateRangeKey;
  from: string; // inclusive ISO
  to: string; // exclusive ISO
  label: string;
  granularity: "day" | "month";
};

export type SeriesPoint = {
  label: string;
  revenue: number; // paise
  orders: number;
};

export type TopProduct = {
  key: string;
  title: string;
  units: number;
  revenue: number;
};

export type TopCategory = {
  name: string;
  revenue: number;
  units: number;
};

export type RecentSale = {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  paymentStatus: PaymentStatus;
  placedAt: string;
};

export type BestCustomer = {
  id: string | null;
  name: string;
  email: string;
  orders: number;
  spend: number;
};

export type Breakdown = {
  label: string;
  count: number;
  amount: number;
};

export type AnalyticsKpis = {
  revenue: number;
  orders: number;
  customers: number;
  averageOrderValue: number;
  paidOrders: number;
  unitsSold: number;
};

export type AnalyticsData = {
  range: ResolvedRange;
  kpis: AnalyticsKpis;
  series: SeriesPoint[];
  topProducts: TopProduct[];
  topCategories: TopCategory[];
  recentSales: RecentSale[];
  bestCustomers: BestCustomer[];
  statusBreakdown: { status: OrderStatus; count: number }[];
  paymentBreakdown: Breakdown[];
};
