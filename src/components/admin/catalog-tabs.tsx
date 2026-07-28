"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { label: "Products", href: "/admin/catalog/products" },
  { label: "Categories", href: "/admin/catalog/categories" },
  { label: "Collections", href: "/admin/catalog/collections" },
] as const;

export function CatalogTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <nav className="-mb-px flex gap-1">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
