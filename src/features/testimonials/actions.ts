"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runStaffAction } from "@/lib/auth/guard";
import { type Result } from "@/lib/result";
import { uuidSchema } from "@/lib/validation/common";

import { testimonialFormSchema } from "./schema";
import * as service from "./service";
import { type Testimonial } from "./types";

const ADMIN_PATH = "/admin/testimonials";

/** Revalidate the admin list and the storefront (home + testimonials). */
function revalidate() {
  revalidatePath(ADMIN_PATH);
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
    const nextStatus = z.enum(["published", "hidden"]).parse(status);
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
