import {
  type LucideIcon,
  CircleDot,
  CreditCard,
  MessageSquare,
  Sparkles,
  Truck,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { type OrderEvent } from "../types";

type EventMeta = { icon: LucideIcon; ring: string; text: string };

const DEFAULT_META: EventMeta = {
  icon: CircleDot,
  ring: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
  text: "text-foreground",
};

const KIND_META: Record<string, EventMeta> = {
  created: {
    icon: Sparkles,
    ring: "bg-white/10 text-white ring-white/15",
    text: "text-white",
  },
  status: DEFAULT_META,
  payment: {
    icon: CreditCard,
    ring: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    text: "text-foreground",
  },
  fulfillment: {
    icon: Truck,
    ring: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    text: "text-foreground",
  },
  note: {
    icon: MessageSquare,
    ring: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    text: "text-foreground",
  },
};

const stampFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function meta(kind: string): EventMeta {
  return KIND_META[kind] ?? DEFAULT_META;
}

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No timeline entries yet.</p>
    );
  }

  return (
    <ol className="relative space-y-5">
      {events.map((event, index) => {
        const m = meta(event.kind);
        const Icon = m.icon;
        const isLast = index === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-3.5">
            {!isLast ? (
              <span className="absolute top-8 left-[15px] h-[calc(100%-4px)] w-px bg-white/[0.08]" />
            ) : null}
            <span
              className={cn(
                "z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-1",
                m.ring,
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className={cn("text-sm leading-snug", m.text)}>
                {event.message}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {stampFmt.format(new Date(event.created_at))}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
