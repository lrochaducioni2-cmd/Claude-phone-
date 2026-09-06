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

export const taskSchema = z.object({
  title: z.string().trim().min(2, "Título deve ter pelo menos 2 caracteres."),
  description: z.string().trim().optional().or(z.literal("")),
  dueDate: z.string().trim().optional().or(z.literal("")),
  contactId: z.string().trim().optional().or(z.literal("")),
  dealId: z.string().trim().optional().or(z.literal("")),
  done: z.boolean().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;

export const travelPolicySchema = z.object({
  originCity: z.string().trim().min(1, "Informe a cidade de origem."),
  dailyHotelRate: z.coerce.number().min(0).default(0),
  lunchRate: z.coerce.number().min(0).default(0),
  dinnerRate: z.coerce.number().min(0).default(0),
  defaultTravelDays: z.coerce.number().min(0).default(1),
  fuelPricePerLiter: z.coerce.number().min(0).default(0),
  vehicleConsumptionKmPerLiter: z.coerce.number().min(0.01, "Consumo deve ser maior que zero.").default(10),
  flightTicketDefault: z.coerce.number().min(0).default(0),
  rentalCarDailyRate: z.coerce.number().min(0).default(0),
  parkingDefault: z.coerce.number().min(0).default(0),
});

export type TravelPolicyInput = z.infer<typeof travelPolicySchema>;

export const laborRateSchema = z.object({
  code: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  hourlyCost: z.coerce.number().min(0, "Custo-hora não pode ser negativo."),
  active: z.boolean().default(true),
});

export type LaborRateInput = z.infer<typeof laborRateSchema>;

export const inspectionAccessModeValues = ["NIVEL_SOLO", "COM_ESCADAS"] as const;
export const inspectionLevelValues = ["VISUAL", "APURADA", "DETALHADA"] as const;

export const inspectionTimeStandardSchema = z.object({
  accessMode: z.enum(inspectionAccessModeValues),
  inspectionLevel: z.enum(inspectionLevelValues),
  minutesPerUnit: z.coerce.number().min(0, "Minutos não pode ser negativo."),
});

export type InspectionTimeStandardInput = z.infer<typeof inspectionTimeStandardSchema>;

export const quoteTypeValues = [
  "ESTUDO_CLASSIFICACAO_DIARIA",
  "PROJETO",
  "CONSULTORIA",
  "INSPECAO_INICIAL",
  "INSPECAO_APURADA",
  "INSPECAO_DETALHADA",
  "INSTALACAO_TREINAMENTO",
] as const;

export const quoteStatusValues = ["DRAFT", "SENT", "APPROVED", "REJECTED", "EXPIRED"] as const;

export const quoteItemCategoryValues = ["MAO_DE_OBRA", "MATERIAL", "DESPESA", "OUTROS"] as const;

export const quoteItemSchema = z.object({
  category: z.enum(quoteItemCategoryValues),
  description: z.string().trim().min(1, "Descrição obrigatória."),
  quantity: z.coerce.number().min(0, "Quantidade não pode ser negativa."),
  unitCost: z.coerce.number().min(0, "Valor não pode ser negativo."),
  unit: z.string().trim().optional().or(z.literal("")),
});

export type QuoteItemInput = z.infer<typeof quoteItemSchema>;

export const quoteSchema = z.object({
  type: z.enum(quoteTypeValues),
  status: z.enum(quoteStatusValues).default("DRAFT"),
  title: z.string().trim().min(2, "Título deve ter pelo menos 2 caracteres."),
  contactId: z.string().min(1, "Selecione um contato."),
  dealId: z.string().trim().optional().or(z.literal("")),
  validUntil: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  laborMarginPct: z.coerce.number().min(0).max(0.99),
  expenseMarginPct: z.coerce.number().min(0).max(0.99),
  issPct: z.coerce.number().min(0).max(1),
  fieldDays: z.coerce.number().min(0),
  travelDays: z.coerce.number().min(0),
  items: z.array(quoteItemSchema).default([]),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

export const quoteUpdateSchema = quoteSchema.partial();
