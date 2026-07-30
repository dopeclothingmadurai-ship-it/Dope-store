import { z } from "zod";

export const orderStatusSchema = z.enum([
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const paymentStatusSchema = z.enum([
  "pending",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
]);

export const fulfillmentStatusSchema = z.enum([
  "unfulfilled",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const orderNoteSchema = z.object({
  message: z.string().trim().min(1, "Note is required").max(2000, "Too long"),
});

export const staffNoteSchema = z.object({
  note: z.string().trim().max(4000, "Too long").nullable(),
});

export type OrderNoteValues = z.infer<typeof orderNoteSchema>;
export type StaffNoteValues = z.infer<typeof staffNoteSchema>;
