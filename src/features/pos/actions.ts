"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runStaffAction } from "@/lib/auth/guard";
import { type OrderDetail } from "@/features/orders/types";
import { type Result } from "@/lib/result";

import * as queries from "./queries";
import { posOrderSchema } from "./schema";
import * as service from "./service";
import { type PosCustomer, type PosSearchItem } from "./types";

const termSchema = z.object({ term: z.string().trim().max(120) });

export async function searchPosItemsAction(
  input: unknown,
): Promise<Result<PosSearchItem[]>> {
  return runStaffAction(async () => {
    const { term } = termSchema.parse(input);
    return queries.searchItems(term);
  });
}

export async function searchPosCustomersAction(
  input: unknown,
): Promise<Result<PosCustomer[]>> {
  return runStaffAction(async () => {
    const { term } = termSchema.parse(input);
    return queries.searchCustomers(term);
  });
}

export async function createPosOrderAction(
  input: unknown,
): Promise<Result<OrderDetail>> {
  return runStaffAction(async () => {
    const values = posOrderSchema.parse(input);
    const order = await service.createPosOrder(values);
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/customers");
    revalidatePath("/admin/coupons");
    return order;
  });
}
