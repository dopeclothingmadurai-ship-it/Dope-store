"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatPaise } from "@/lib/money";

import { type SeriesPoint } from "../types";

const REVENUE = "#34d399";
const ORDERS = "#60a5fa";
const GRID = "rgba(255,255,255,0.06)";
const AXIS = "#9ca3af";
const DONUT = [
  "#ffffff",
  "#34d399",
  "#f59e0b",
  "#60a5fa",
  "#a78bfa",
  "#f87171",
];

const compact = new Intl.NumberFormat("en-IN", { notation: "compact" });

function TooltipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#161616] px-3 py-2 text-xs shadow-lg">
      {children}
    </div>
  );
}

type TooltipEntry = { payload: SeriesPoint };

function RevenueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  return (
    <TooltipBox>
      <p className="mb-1 font-medium text-white">{point.label}</p>
      <p className="text-emerald-400">{formatPaise(point.revenue)}</p>
    </TooltipBox>
  );
}

function OrdersTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  return (
    <TooltipBox>
      <p className="mb-1 font-medium text-white">{point.label}</p>
      <p className="text-sky-400">
        {point.orders} {point.orders === 1 ? "order" : "orders"}
      </p>
    </TooltipBox>
  );
}

export function RevenueAreaChart({ series }: { series: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={series}
        margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={REVENUE} stopOpacity={0.35} />
            <stop offset="100%" stopColor={REVENUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          stroke={AXIS}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          stroke={AXIS}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(value: number) => `₹${compact.format(value / 100)}`}
        />
        <Tooltip
          content={<RevenueTooltip />}
          cursor={{ stroke: GRID, strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={REVENUE}
          strokeWidth={2}
          fill="url(#revenueFill)"
          dot={false}
          activeDot={{ r: 4, fill: REVENUE }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrdersBarChart({ series }: { series: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={series} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <XAxis
          dataKey="label"
          stroke={AXIS}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          stroke={AXIS}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <Tooltip
          content={<OrdersTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar
          dataKey="orders"
          fill={ORDERS}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export type DonutDatum = { name: string; value: number };

function DonutTooltip({
  active,
  payload,
  suffix,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  if (!entry) return null;
  return (
    <TooltipBox>
      <p className="font-medium text-white">
        {entry.name}: {entry.value}
        {suffix ? ` ${suffix}` : ""}
      </p>
    </TooltipBox>
  );
}

export function BreakdownDonut({
  data,
  suffix,
}: {
  data: DonutDatum[];
  suffix?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
        No data in this range.
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={180} className="max-w-[200px]">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={DONUT[index % DONUT.length]} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip suffix={suffix} />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="w-full space-y-2">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: DONUT[index % DONUT.length] }}
            />
            <span className="flex-1 truncate capitalize">{entry.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
