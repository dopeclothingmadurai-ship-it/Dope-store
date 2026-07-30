import {
  type LucideIcon,
  BarChart3,
  LayoutDashboard,
  Package,
  Layers,
  FolderTree,
  ShoppingBag,
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

/** Admin sidebar navigation. Phase 2 ships Catalog; Phase 4 adds Sales. */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
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
    label: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "Customers", href: "/admin/customers", icon: Users },
    ],
  },
  {
    label: "Marketing",
    items: [{ label: "Coupons", href: "/admin/coupons", icon: Ticket }],
  },
];
