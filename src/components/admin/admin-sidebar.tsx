"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_NAV } from "@/config/admin-nav";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      {ADMIN_NAV.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="text-muted-foreground px-3 text-xs font-medium tracking-wide uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link
      href="/admin/catalog/products"
      className="flex items-center gap-2 px-3"
    >
      <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-sm font-semibold">
        D
      </span>
      <span className="font-heading text-sm font-semibold tracking-tight">
        Dope Store
        <span className="text-muted-foreground ml-1 font-normal">Admin</span>
      </span>
    </Link>
  );
}

export function AdminSidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="bg-sidebar hidden w-60 shrink-0 flex-col gap-6 border-r px-3 py-5 md:flex">
        <Brand />
        <NavLinks />
      </aside>

      {/* Mobile top bar */}
      <div className="bg-sidebar sticky top-0 z-30 flex flex-col gap-3 border-b px-3 py-3 md:hidden">
        <Brand />
        <div className="overflow-x-auto">
          <NavLinks />
        </div>
      </div>
    </>
  );
}
