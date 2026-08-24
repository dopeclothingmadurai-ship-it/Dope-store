import {
  type LucideIcon,
  BarChart3,
  Building2,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquareQuote,
  Package,
  Layers,
  FolderTree,
  Settings,
  ShoppingBag,
  Store,
  Ticket,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

/**
 * Admin sidebar navigation. Grouped, but ordered to follow the daily flow:
 * overview → sell → merchandise → market → point of sale → system.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "Customers", href: "/admin/customers", icon: Users },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/catalog/products", icon: Package },
      {
        label: "Categories",
        href: "/admin/catalog/categories",
        icon: FolderTree,
      },
      {
        label: "Collections",
        href: "/admin/catalog/collections",
        icon: Layers,
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Homepage", href: "/admin/content", icon: LayoutTemplate },
      { label: "Coupons", href: "/admin/coupons", icon: Ticket },
      {
        label: "Testimonials",
        href: "/admin/testimonials",
        icon: MessageSquareQuote,
      },
    ],
  },
  {
    label: "Point of Sale",
    items: [
      { label: "Offline Billing", href: "/admin/pos", icon: Store },
      { label: "Franchises", href: "/admin/franchise", icon: Building2 },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/admin/settings", icon: Settings }],
  },
];
