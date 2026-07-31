"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type LucideIcon,
  BarChart3,
  CornerDownLeft,
  FolderTree,
  Layers,
  LayoutDashboard,
  Loader2,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Ticket,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { globalSearchAction } from "@/features/search";
import { type SearchKind, type SearchResults } from "@/features/search/types";
import { cn } from "@/lib/utils";

export const OPEN_COMMAND_PALETTE_EVENT = "dope:open-command-palette";

type PaletteItem = {
  key: string;
  group: string;
  title: string;
  subtitle: string | null;
  href: string;
  icon: LucideIcon;
};

const PAGES: { title: string; href: string; icon: LucideIcon }[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { title: "Customers", href: "/admin/customers", icon: Users },
  { title: "Products", href: "/admin/catalog/products", icon: Package },
  { title: "Categories", href: "/admin/catalog/categories", icon: FolderTree },
  { title: "Collections", href: "/admin/catalog/collections", icon: Layers },
  { title: "Coupons", href: "/admin/coupons", icon: Ticket },
  { title: "Offline Billing", href: "/admin/pos", icon: Store },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

const KIND_ICON: Record<SearchKind, LucideIcon> = {
  product: Package,
  order: ShoppingBag,
  customer: Users,
  coupon: Ticket,
};

const EMPTY: SearchResults = {
  products: [],
  orders: [],
  customers: [],
  coupons: [],
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Global ⌘K / Ctrl+K, plus an event other chrome can dispatch to open it.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen);
    };
  }, []);

  // Reset transient state whenever the palette opens.
  useEffect(() => {
    if (open) {
      setTerm("");
      setResults(EMPTY);
      setActive(0);
    }
  }, [open]);

  // Debounced cross-entity search.
  useEffect(() => {
    const query = term.trim();
    if (!query) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const res = await globalSearchAction({ term: query });
      if (res.ok) setResults(res.data);
      setLoading(false);
    }, 200);
    return () => clearTimeout(handle);
  }, [term]);

  const items = useMemo<PaletteItem[]>(() => {
    const query = term.trim().toLowerCase();
    const pages = PAGES.filter(
      (page) => !query || page.title.toLowerCase().includes(query),
    ).map((page) => ({
      key: `page:${page.href}`,
      group: "Go to",
      title: page.title,
      subtitle: null,
      href: page.href,
      icon: page.icon,
    }));

    const mapGroup = (
      group: string,
      list: SearchResults[keyof SearchResults],
    ): PaletteItem[] =>
      list.map((item) => ({
        key: `${item.kind}:${item.id}`,
        group,
        title: item.title,
        subtitle: item.subtitle,
        href: item.href,
        icon: KIND_ICON[item.kind],
      }));

    return [
      ...pages,
      ...mapGroup("Products", results.products),
      ...mapGroup("Orders", results.orders),
      ...mapGroup("Customers", results.customers),
      ...mapGroup("Coupons", results.coupons),
    ];
  }, [term, results]);

  useEffect(() => {
    setActive((prev) => (prev >= items.length ? 0 : prev));
  }, [items.length]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const select = useCallback(
    (item: PaletteItem | undefined) => {
      if (!item) return;
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((prev) => Math.min(items.length - 1, prev + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((prev) => Math.max(0, prev - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(items[active]);
    }
  }

  // Render items grouped, but keep a single running index for keyboard nav.
  let runningIndex = -1;
  const groups: {
    label: string;
    entries: { item: PaletteItem; index: number }[];
  }[] = [];
  for (const item of items) {
    runningIndex += 1;
    const last = groups[groups.length - 1];
    if (last && last.label === item.group) {
      last.entries.push({ item, index: runningIndex });
    } else {
      groups.push({
        label: item.group,
        entries: [{ item, index: runningIndex }],
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] w-full max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search products, orders, customers, coupons and pages.
        </DialogDescription>

        <div className="flex items-center gap-2.5 border-b px-4">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search or jump to…"
            className="placeholder:text-muted-foreground h-12 w-full bg-transparent text-sm outline-none"
          />
          {loading ? (
            <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
          ) : null}
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              No results for “{term}”.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-1 last:mb-0">
                <p className="text-muted-foreground/70 px-2 py-1.5 text-[11px] font-medium tracking-wider uppercase">
                  {group.label}
                </p>
                {group.entries.map(({ item, index }) => (
                  <button
                    key={item.key}
                    type="button"
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => select(item)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      index === active
                        ? "bg-white/[0.07] text-white"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="text-foreground min-w-0 flex-1 truncate">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="text-muted-foreground shrink-0 truncate text-xs capitalize">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="text-muted-foreground flex items-center gap-3 border-t px-4 py-2 text-[11px]">
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1">↑</kbd>
            <kbd className="rounded border px-1">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1">
              <CornerDownLeft className="size-3" />
            </kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1">esc</kbd>
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
