"use server";

import { revalidatePath } from "next/cache";

import { runStaffAction } from "@/lib/auth/guard";
import { type Result } from "@/lib/result";
import { uuidSchema } from "@/lib/validation/common";

import {
  fulfillmentStatusSchema,
  orderNoteSchema,
  orderStatusSchema,
  paymentStatusSchema,
  staffNoteSchema,
} from "./schema";
import * as service from "./service";
import { type Order, type OrderEvent } from "./types";

const LIST_PATH = "/admin/orders";

function revalidateOrder(id: string) {
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
}

export async function updateOrderStatusAction(
  id: unknown,
  status: unknown,
): Promise<Result<Order>> {
  return runStaffAction(async () => {
    const orderId = uuidSchema.parse(id);
    const value = orderStatusSchema.parse(status);
    const order = await service.updateOrderStatus(orderId, value);
    revalidateOrder(orderId);
    return order;
  });
}

export async function updatePaymentStatusAction(
  id: unknown,
  status: unknown,
): Promise<Result<Order>> {
  return runStaffAction(async () => {
    const orderId = uuidSchema.parse(id);
    const value = paymentStatusSchema.parse(status);
    const order = await service.updatePaymentStatus(orderId, value);
    revalidateOrder(orderId);
    return order;
  });
}

export async function updateFulfillmentStatusAction(
  id: unknown,
  status: unknown,
): Promise<Result<Order>> {
  return runStaffAction(async () => {
    const orderId = uuidSchema.parse(id);
    const value = fulfillmentStatusSchema.parse(status);
    const order = await service.updateFulfillmentStatus(orderId, value);
    revalidateOrder(orderId);
    return order;
  });
}

export async function updateStaffNoteAction(
  id: unknown,
  input: unknown,
): Promise<Result<Order>> {
  return runStaffAction(async () => {
    const orderId = uuidSchema.parse(id);
    const { note } = staffNoteSchema.parse(input);
    const order = await service.updateStaffNote(orderId, note);
    revalidateOrder(orderId);
    return order;
  });
}

export async function addOrderNoteAction(
  id: unknown,
  input: unknown,
): Promise<Result<OrderEvent>> {
  return runStaffAction(async () => {
    const orderId = uuidSchema.parse(id);
    const { message } = orderNoteSchema.parse(input);
    const event = await service.addOrderNote(orderId, message);
    revalidateOrder(orderId);
    return event;
  });
}
