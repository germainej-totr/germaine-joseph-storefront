// lib/api-utils.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const handleApiError = (error: unknown, message = "Internal Server Error") => {
  console.error("[API Error]:", error);
  return NextResponse.json(
    { error: message, details: error instanceof Error ? error.message : "Unknown error" },
    { status: 500 }
  );
};

export const validateRequest = (schema: z.ZodTypeAny, data: unknown) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.format() };
  }
  return { success: true, data: result.data };
};