"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  admin: "Admin",
  catalog: "Catalog",
  products: "Products",
  categories: "Categories",
  collections: "Collections",
  orders: "Orders",
  customers: "Customers",
  new: "New",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Crumb = { label: string; href: string };

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let href = "";

  segments.forEach((segment, index) => {
    href += `/${segment}`;
    // A dynamic id segment is shown as an action label based on its parent.
    if (UUID_RE.test(segment)) {
      const parent = segments[index - 1];
      const label =
        parent === "collections"
          ? "Manage"
          : parent === "orders"
            ? "Details"
            : parent === "customers"
              ? "Profile"
              : "Edit";
      crumbs.push({ label, href });
      return;
    }
    crumbs.push({
      label: LABELS[segment] ?? segment,
      href,
    });
  });

  return crumbs;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight className="text-muted-foreground/60 size-3.5" />
            ) : null}
            {isLast ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors",
                )}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
