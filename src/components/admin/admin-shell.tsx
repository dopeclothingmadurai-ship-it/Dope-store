"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";

import { Breadcrumbs } from "@/components/admin/breadcrumbs";
import {
  CommandPalette,
  OPEN_COMMAND_PALETTE_EVENT,
} from "@/components/admin/command-palette";
import { DopeLogo } from "@/components/admin/logo";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV } from "@/config/admin-nav";
import { signOutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dope-admin-sidebar-collapsed";
const EXPANDED = 256;
const COLLAPSED = 76;

function useActive(href: string) {
  const pathname = usePathname();
  // The dashboard lives at the admin root, so it must match exactly — otherwise
  // every /admin/* route would light it up.
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  href,
  label,
  icon: Icon,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: (typeof ADMIN_NAV)[number]["items"][number]["icon"];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const active = useActive(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-white/[0.07] text-white"
          : "text-muted-foreground hover:bg-white/[0.04] hover:text-white",
      )}
    >
      {active ? (
        <motion.span
          layoutId="admin-nav-active"
          className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      ) : null}
      <Icon className="size-[18px] shrink-0" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/admin/catalog/products"
      className="flex h-9 items-center gap-2.5 px-1"
      aria-label="Dope Store admin"
    >
      <DopeLogo size={34} />
      {!collapsed ? (
        <span className="font-heading text-sm font-semibold tracking-tight text-white">
          Dope Store
        </span>
      ) : null}
    </Link>
  );
}

function UserProfile({
  email,
  collapsed,
}: {
  email: string;
  collapsed: boolean;
}) {
  const initial = (email.trim()[0] ?? "?").toUpperCase();
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2",
        collapsed && "flex-col gap-2 px-0",
      )}
    >
      <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ring-1 ring-white/10">
        {initial}
      </span>
      {!collapsed ? (
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground truncate text-xs" title={email}>
            {email}
          </p>
        </div>
      ) : null}
      <form action={signOutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-white"
          title="Sign out"
        >
          <LogOut className="size-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </form>
    </div>
  );
}

function SidebarInner({
  collapsed,
  email,
  onToggle,
  onNavigate,
  showToggle = true,
}: {
  collapsed: boolean;
  email: string;
  onToggle?: () => void;
  onNavigate?: () => void;
  showToggle?: boolean;
}) {
  return (
    <div className="flex h-full flex-col gap-6 px-3 py-4">
      <div className="flex items-center justify-between">
        <Brand collapsed={collapsed} />
        {showToggle && !collapsed ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-white"
            onClick={onToggle}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
            <span className="sr-only">Collapse sidebar</span>
          </Button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-6">
        {ADMIN_NAV.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            {!collapsed ? (
              <p className="text-muted-foreground/70 px-3 pb-1 text-[11px] font-medium tracking-wider uppercase">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      {showToggle && collapsed ? (
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground mx-auto hover:text-white"
          onClick={onToggle}
          title="Expand sidebar"
        >
          <PanelLeftOpen className="size-4" />
          <span className="sr-only">Expand sidebar</span>
        </Button>
      ) : null}

      <UserProfile email={email} collapsed={collapsed} />
    </div>
  );
}

export function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  // Close the mobile drawer on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function openCommandPalette() {
    window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <CommandPalette />

      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? COLLAPSED : EXPANDED }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-30 hidden border-r md:block"
      >
        <SidebarInner
          collapsed={collapsed}
          email={userEmail}
          onToggle={toggleCollapsed}
        />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-50 w-64 border-r md:hidden"
            >
              <div className="flex justify-end px-3 pt-4">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setMobileOpen(false)}
                  title="Close menu"
                >
                  <X className="size-4" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
              <SidebarInner
                collapsed={false}
                email={userEmail}
                showToggle={false}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* Main column */}
      <div
        className="flex min-h-screen flex-col transition-[padding] duration-200 md:pl-(--admin-sidebar-w)"
        style={
          {
            "--admin-sidebar-w": `${collapsed ? COLLAPSED : EXPANDED}px`,
          } as React.CSSProperties
        }
      >
        <header className="bg-background/70 border-border sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            title="Open menu"
          >
            <Menu className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>

          <Breadcrumbs />

          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Search"
            className="text-muted-foreground hover:text-foreground ml-auto hidden h-9 w-44 items-center gap-2 rounded-full border px-3 text-sm transition-colors hover:border-white/20 sm:flex lg:w-64"
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="border-border rounded border px-1.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto sm:hidden"
            onClick={openCommandPalette}
            title="Search"
          >
            <Search className="size-4" />
            <span className="sr-only">Search</span>
          </Button>

          <span
            className="bg-muted ml-auto flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white ring-1 ring-white/10 sm:ml-0"
            title={userEmail}
          >
            {(userEmail.trim()[0] ?? "?").toUpperCase()}
          </span>
        </header>

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
