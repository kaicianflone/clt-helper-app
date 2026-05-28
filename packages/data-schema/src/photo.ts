import { z } from "zod";

export const PhotoSchema = z.object({
  url: z.string().url(),
  caption: z.string(),
  attribution: z.string(),
});

export type Photo = z.infer<typeof PhotoSchema>;
