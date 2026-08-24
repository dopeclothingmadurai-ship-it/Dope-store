"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCustomer } from "@/lib/auth/customer";
import { runAction } from "@/lib/errors";
import { runStaffAction } from "@/lib/auth/guard";
import { type Result } from "@/lib/result";
import { uuidSchema } from "@/lib/validation/common";

import {
  customerTestimonialSchema,
  testimonialFormSchema,
  testimonialStatusSchema,
} from "./schema";
import * as service from "./service";
import { type Testimonial } from "./types";

const ADMIN_PATH = "/admin/testimonials";

/** Revalidate the admin list and the storefront (home + testimonials). */
function revalidate() {
  revalidatePath(ADMIN_PATH);
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
}

export async function createTestimonialAction(
  input: unknown,
): Promise<Result<Testimonial>> {
  return runStaffAction(async () => {
    const values = testimonialFormSchema.parse(input);
    const testimonial = await service.createTestimonial(values);
    revalidate();
    return testimonial;
  });
}

export async function updateTestimonialAction(
  id: unknown,
  input: unknown,
): Promise<Result<Testimonial>> {
  return runStaffAction(async () => {
    const testimonialId = uuidSchema.parse(id);
    const values = testimonialFormSchema.parse(input);
    const testimonial = await service.updateTestimonial(testimonialId, values);
    revalidate();
    return testimonial;
  });
}

export async function setTestimonialStatusAction(
  id: unknown,
  status: unknown,
): Promise<Result<Testimonial>> {
  return runStaffAction(async () => {
    const testimonialId = uuidSchema.parse(id);
    const nextStatus = testimonialStatusSchema.parse(status);
    const testimonial = await service.setTestimonialStatus(
      testimonialId,
      nextStatus,
    );
    revalidate();
    return testimonial;
  });
}

export async function deleteTestimonialAction(
  id: unknown,
): Promise<Result<null>> {
  return runStaffAction(async () => {
    await service.deleteTestimonial(uuidSchema.parse(id));
    revalidate();
    return null;
  });
}

export async function reorderTestimonialsAction(
  ids: unknown,
): Promise<Result<null>> {
  return runStaffAction(async () => {
    const orderedIds = z.array(uuidSchema).parse(ids);
    await service.reorderTestimonials(orderedIds);
    revalidate();
    return null;
  });
}

/**
 * A signed-in customer submits their own testimonial. Stored as `pending` — it
 * never appears publicly until an admin approves it.
 */
export async function submitTestimonialAction(
  input: unknown,
): Promise<Result<{ status: "pending" }>> {
  return runAction(async () => {
    const customer = await requireCustomer();
    const values = customerTestimonialSchema.parse(input);
    await service.submitCustomerTestimonial({
      userId: customer.user.id,
      input: values,
    });
    revalidatePath(ADMIN_PATH);
    revalidatePath("/admin/content");
    return { status: "pending" as const };
  });
}
