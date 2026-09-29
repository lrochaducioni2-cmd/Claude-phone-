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

// --- Inspeção Ex ---------------------------------------------------------

export const exAtmosphereValues = ["GAS", "POEIRA"] as const;
export const exZoneValues = ["ZONA_0", "ZONA_1", "ZONA_2", "ZONA_20", "ZONA_21", "ZONA_22"] as const;
export const exGroupValues = ["II", "IIA", "IIB", "IIC", "III", "IIIA", "IIIB", "IIIC"] as const;
export const exTemperatureClassValues = ["T1", "T2", "T3", "T4", "T5", "T6"] as const;
export const exEplValues = ["Ga", "Gb", "Gc", "Da", "Db", "Dc"] as const;
export const exProtectionTypeValues = ["D", "E", "I", "N", "P", "M", "O", "Q", "T", "S"] as const;
export const exInspectionTypeValues = ["INICIAL", "PERIODICA", "AMOSTRAGEM"] as const;
export const exInspectionStatusValues = ["EM_ANDAMENTO", "CONCLUIDA"] as const;
export const exCheckAnswerValues = ["C", "NC", "NA"] as const;

const optionalText = z.string().trim().optional().or(z.literal(""));
const optionalNumber = z
  .union([z.literal(""), z.null(), z.coerce.number()])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

export const exFacilitySchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  location: optionalText,
  notes: optionalText,
  contactId: optionalText,
});

export type ExFacilityInput = z.infer<typeof exFacilitySchema>;

const ZONES_BY_ATMOSPHERE: Record<(typeof exAtmosphereValues)[number], readonly string[]> = {
  GAS: ["ZONA_0", "ZONA_1", "ZONA_2"],
  POEIRA: ["ZONA_20", "ZONA_21", "ZONA_22"],
};

const exAreaBaseSchema = z.object({
  facilityId: z.string().min(1, "Selecione a instalação."),
  name: z.string().trim().min(1, "Informe o nome da área."),
  atmosphere: z.enum(exAtmosphereValues).default("GAS"),
  zone: z.enum(exZoneValues),
  group: z.enum(exGroupValues).optional().or(z.literal("")),
  temperatureClass: z.enum(exTemperatureClassValues).optional().or(z.literal("")),
  maxSurfaceTempC: optionalNumber,
  notes: optionalText,
});

export function isZoneValidForAtmosphere(atmosphere: string, zone: string): boolean {
  return ZONES_BY_ATMOSPHERE[atmosphere as (typeof exAtmosphereValues)[number]]?.includes(zone) ?? false;
}

export const exAreaSchema = exAreaBaseSchema.refine(
  (area) => isZoneValidForAtmosphere(area.atmosphere, area.zone),
  { message: "Zona incompatível com o tipo de atmosfera.", path: ["zone"] },
);

export const exAreaUpdateSchema = exAreaBaseSchema.omit({ facilityId: true }).partial();

export type ExAreaInput = z.infer<typeof exAreaSchema>;

export const exEquipmentSchema = z.object({
  areaId: z.string().min(1, "Selecione a área."),
  tag: z.string().trim().min(1, "Informe a TAG."),
  description: z.string().trim().min(1, "Informe a descrição."),
  manufacturer: optionalText,
  model: optionalText,
  serialNumber: optionalText,
  marking: optionalText,
  protectionTypes: z.array(z.enum(exProtectionTypeValues)).default([]),
  group: z.enum(exGroupValues).optional().or(z.literal("")),
  temperatureClass: z.enum(exTemperatureClassValues).optional().or(z.literal("")),
  maxSurfaceTempC: optionalNumber,
  epl: z.enum(exEplValues).optional().or(z.literal("")),
  ipRating: optionalText,
  certificateNumber: optionalText,
  notes: optionalText,
});

export type ExEquipmentInput = z.infer<typeof exEquipmentSchema>;

export const exInspectionSchema = z.object({
  facilityId: z.string().min(1, "Selecione a instalação."),
  level: z.enum(inspectionLevelValues),
  type: z.enum(exInspectionTypeValues).default("PERIODICA"),
  inspectorName: optionalText,
  date: optionalText,
  notes: optionalText,
  quoteId: optionalText,
  // Áreas a incluir; vazio = todas as áreas da instalação.
  areaIds: z.array(z.string()).default([]),
});

export type ExInspectionInput = z.infer<typeof exInspectionSchema>;

export const exInspectionUpdateSchema = z.object({
  status: z.enum(exInspectionStatusValues).optional(),
  type: z.enum(exInspectionTypeValues).optional(),
  inspectorName: optionalText,
  date: optionalText,
  notes: optionalText,
});

export const exInspectionItemUpdateSchema = z.object({
  answers: z.record(z.string(), z.enum(exCheckAnswerValues)).optional(),
  notes: optionalText,
});
