import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  email: z.email("Informe um e-mail válido.").trim(),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres."),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const leadStatusValues = ["NEW", "CONTACTED", "QUALIFIED", "CUSTOMER", "LOST"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  email: z.email("Informe um e-mail válido.").trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  company: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  status: z.enum(leadStatusValues).default("NEW"),
});

export type ContactInput = z.infer<typeof contactSchema>;
