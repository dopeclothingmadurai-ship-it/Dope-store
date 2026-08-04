"use client";

import { type ReactNode, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * A horizontal, snap-aligned rail with pointer drag-to-scroll on desktop and
 * native momentum scrolling on touch. The scrollbar is hidden for a clean
 * editorial feel; content stays keyboard- and wheel-scrollable.
 */
export function DragRail({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  function onPointerDown(event: React.PointerEvent) {
    // Only hijack primary-button drags on fine pointers (mouse/trackpad).
    if (event.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: event.clientX,
      startLeft: el.scrollLeft,
      moved: false,
    };
  }

  function onPointerMove(event: React.PointerEvent) {
    const el = ref.current;
    if (!el || !drag.current.active) return;
    const delta = event.clientX - drag.current.startX;
    if (Math.abs(delta) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startLeft - delta;
  }

  function endDrag() {
    drag.current.active = false;
  }

  // Suppress the click that follows a drag so cards don't navigate mid-swipe.
  function onClickCapture(event: React.MouseEvent) {
    if (drag.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = false;
    }
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClickCapture={onClickCapture}
      className={cn(
        "flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain select-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      {children}
    </div>
  );
}
