import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().trim().min(1).max(280),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
