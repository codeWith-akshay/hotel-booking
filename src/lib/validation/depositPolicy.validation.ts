/**
 * Deposit Policy Validation Schemas
 * Day 12: Group Booking, Deposits & Special Days
 * 
 * Provides Zod validation schemas for deposit policy operations:
 * - Create deposit policy (SuperAdmin only)
 * - Update deposit policy
 * - Delete deposit policy
 * - List/query deposit policies
 * 
 * @module depositPolicy.validation
 */

import { z } from 'zod';

/**
 * Deposit Type Enum Schema
 * Defines how deposit amount is calculated
 */
export const depositTypeSchema = z.enum(['percent', 'fixed'], {
  message: 'Deposit type must be either "percent" or "fixed"',
});

/**
 * Create Deposit Policy Schema
 * Used when creating a new deposit policy
 * 
 * @example
 * {
 *   minRooms: 10,
 *   maxRooms: 19,
 *   type: "percent",
 *   value: 20.0,
 *   description: "10-19 rooms require 20% deposit"
 * }
 */
export const createDepositPolicySchema = z.object({
  minRooms: z.number().int().positive('Minimum rooms must be positive'),
  
  maxRooms: z.number().int().positive('Maximum rooms must be positive'),
  
  type: depositTypeSchema,
  
  value: z.number().positive('Deposit value must be positive'),
  
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  
  active: z.boolean().default(true),
}).refine(
  (data) => data.maxRooms >= data.minRooms,
  {
    message: 'Maximum rooms must be greater than or equal to minimum rooms',
    path: ['maxRooms'],
  }
).refine(
  (data) => {
    if (data.type === 'percent') {
      return data.value >= 0 && data.value <= 100;
    }
    return true;
  },
  {
    message: 'Percentage value must be between 0 and 100',
    path: ['value'],
  }
);

export type CreateDepositPolicyInput = z.infer<typeof createDepositPolicySchema>;

/**
 * Update Deposit Policy Schema
 * Used when updating an existing deposit policy
 * All fields except id are optional
 * 
 * @example
 * {
 *   id: "cm1policy123",
 *   value: 25.0,
 *   description: "Updated to 25% deposit"
 * }
 */
export const updateDepositPolicySchema = z.object({
  id: z.string({
    message: 'Deposit policy ID is required',
  }).min(1, 'Deposit policy ID cannot be empty'),
  
  minRooms: z.number().int().positive('Minimum rooms must be positive').optional(),
  
  maxRooms: z.number().int().positive('Maximum rooms must be positive').optional(),
  
  type: depositTypeSchema.optional(),
  
  value: z.number().positive('Deposit value must be positive').optional(),
  
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  
  active: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.minRooms !== undefined && data.maxRooms !== undefined) {
      return data.maxRooms >= data.minRooms;
    }
    return true;
  },
  {
    message: 'Maximum rooms must be greater than or equal to minimum rooms',
    path: ['maxRooms'],
  }
).refine(
  (data) => {
    if (data.type === 'percent' && data.value !== undefined) {
      return data.value >= 0 && data.value <= 100;
    }
    return true;
  },
  {
    message: 'Percentage value must be between 0 and 100',
    path: ['value'],
  }
);

export type UpdateDepositPolicyInput = z.infer<typeof updateDepositPolicySchema>;

/**
 * Deposit Policy ID Schema
 * Used for delete and get operations
 * 
 * @example
 * { id: "cm1policy123" }
 */
export const depositPolicyIdSchema = z.object({
  id: z.string({
    message: 'Deposit policy ID is required',
  }).min(1, 'Deposit policy ID cannot be empty'),
});

export type DepositPolicyIdInput = z.infer<typeof depositPolicyIdSchema>;

/**
 * List Deposit Policies Query Schema
 * Used for filtering and pagination
 * 
 * @example
 * {
 *   active: true,
 *   page: 1,
 *   limit: 20
 * }
 */
export const listDepositPoliciesSchema = z.object({
  active: z.boolean().optional(),
  
  page: z.coerce.number().int().positive().default(1),
  
  limit: z.coerce.number().int().positive().max(100).default(20),
  
  sortBy: z.enum(['minRooms', 'maxRooms', 'createdAt', 'updatedAt']).default('minRooms'),
  
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ListDepositPoliciesInput = z.infer<typeof listDepositPoliciesSchema>;

/**
 * Deposit Policy Response Type
 * Represents a deposit policy returned from the database
 */
export interface DepositPolicyResponse {
  id: string;
  minRooms: number;
  maxRooms: number;
  type: string;
  value: number;
  active: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Calculate Deposit Amount
 * Helper function to calculate deposit based on policy
 * 
 * @param policy - Deposit policy
 * @param totalAmount - Total booking amount in cents
 * @returns Deposit amount in cents
 */
export function calculateDepositAmount(
  policy: { type: string; value: number },
  totalAmount: number
): number {
  if (policy.type === 'percent') {
    return Math.round((totalAmount * policy.value) / 100);
  }
  // Fixed amount (already in cents)
  return Math.round(policy.value);
}

/**
 * Validate Deposit Policy Ranges
 * Ensures no overlapping room ranges in active policies
 * 
 * @param minRooms - Minimum rooms in range
 * @param maxRooms - Maximum rooms in range
 * @param existingPolicies - Array of existing policies to check against
 * @param excludeId - Optional policy ID to exclude from check (for updates)
 * @returns true if valid, false if overlaps detected
 */
export function validatePolicyRanges(
  minRooms: number,
  maxRooms: number,
  existingPolicies: Array<{ id: string; minRooms: number; maxRooms: number; active: boolean }>,
  excludeId?: string
): { valid: boolean; conflictingPolicy?: { id: string; minRooms: number; maxRooms: number } } {
  const activePolicies = existingPolicies.filter(
    (p) => p.active && (!excludeId || p.id !== excludeId)
  );

  for (const policy of activePolicies) {
    // Check for any overlap
    if (
      (minRooms >= policy.minRooms && minRooms <= policy.maxRooms) || // New min overlaps
      (maxRooms >= policy.minRooms && maxRooms <= policy.maxRooms) || // New max overlaps
      (minRooms <= policy.minRooms && maxRooms >= policy.maxRooms) // New range contains existing
    ) {
      return {
        valid: false,
        conflictingPolicy: {
          id: policy.id,
          minRooms: policy.minRooms,
          maxRooms: policy.maxRooms,
        },
      };
    }
  }

  return { valid: true };
}
