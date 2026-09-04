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

export const dealSchema = z.object({
  title: z.string().trim().min(2, "Título deve ter pelo menos 2 caracteres."),
  value: z.coerce.number().min(0, "Valor não pode ser negativo.").default(0),
  contactId: z.string().min(1, "Selecione um contato."),
  stageId: z.string().min(1, "Selecione um estágio."),
});

export type DealInput = z.infer<typeof dealSchema>;

export const dealUpdateSchema = dealSchema.partial().extend({
  order: z.coerce.number().int().optional(),
});
