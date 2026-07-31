"use server";

import { z } from "zod";

import { runStaffAction } from "@/lib/auth/guard";
import { type Result } from "@/lib/result";

import { type ExportEntity, exportCsv } from "./queries";

const entitySchema = z.enum(["products", "orders", "customers", "coupons"]);

export type CsvExport = { filename: string; csv: string };

export async function exportCsvAction(
  entity: unknown,
): Promise<Result<CsvExport>> {
  return runStaffAction(async () => {
    const value = entitySchema.parse(entity) satisfies ExportEntity;
    const csv = await exportCsv(value);
    const date = new Date().toISOString().slice(0, 10);
    return { filename: `dope-${value}-${date}.csv`, csv };
  });
}
