import { z } from "zod";

export const customerNoteSchema = z.object({
  note: z.string().trim().max(4000, "Too long").nullable(),
});

export type CustomerNoteValues = z.infer<typeof customerNoteSchema>;
