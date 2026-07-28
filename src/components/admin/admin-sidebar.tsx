"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ADMIN_NAV } from "@/config/admin-nav";
import { signOutAction } from "@/features/auth/actions";
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

function UserFooter({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      {email ? (
        <p
          className="text-muted-foreground truncate px-3 text-xs"
          title={email}
        >
          {email}
        </p>
      ) : null}
      <form action={signOutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground w-full justify-start"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </form>
    </div>
  );
}

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="bg-sidebar hidden w-60 shrink-0 flex-col gap-6 border-r px-3 py-5 md:flex">
        <Brand />
        <NavLinks />
        <div className="mt-auto">
          <UserFooter email={userEmail} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="bg-sidebar sticky top-0 z-30 flex flex-col gap-3 border-b px-3 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <Brand />
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon-sm">
              <LogOut className="size-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <NavLinks />
        </div>
      </div>
    </>
  );
}
