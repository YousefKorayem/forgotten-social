import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Username must be lowercase alphanumeric or underscore"),
  email: z.email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(50),
});

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
