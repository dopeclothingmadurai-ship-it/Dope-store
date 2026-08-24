import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .or(z.literal("").transform(() => null));

export const franchiseFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Too long"),
  city: optionalText(80),
  location: optionalText(120),
  phone: optionalText(30),
  email: optionalText(160),
  address: optionalText(300),
  status: z.enum(["active", "inactive"]),
  notes: optionalText(1000),
});

export type FranchiseFormValues = z.infer<typeof franchiseFormSchema>;
