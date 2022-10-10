import { object, string, TypeOf } from "zod";

// ============================================
// Schemas
// ============================================

export var checkUserAvailableSchema = object({
  params: object({
    field: string({ required_error: "Field is required" }),
    value: string({ required_error: "Value is required" }),
  }),
});

// ============================================
// Types
// ============================================

export type ZodCheckUserAvailable = TypeOf<typeof checkUserAvailableSchema>;
