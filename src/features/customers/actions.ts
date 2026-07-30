"use server";

import { revalidatePath } from "next/cache";

import { runStaffAction } from "@/lib/auth/guard";
import { type Result } from "@/lib/result";
import { uuidSchema } from "@/lib/validation/common";

import { customerNoteSchema } from "./schema";
import * as service from "./service";
import { type Customer } from "./types";

const LIST_PATH = "/admin/customers";

export async function updateCustomerNoteAction(
  id: unknown,
  input: unknown,
): Promise<Result<Customer>> {
  return runStaffAction(async () => {
    const customerId = uuidSchema.parse(id);
    const { note } = customerNoteSchema.parse(input);
    const customer = await service.updateCustomerNote(customerId, note);
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${customerId}`);
    return customer;
  });
}
