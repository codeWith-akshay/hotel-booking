// ==========================================
// ENHANCED INPUT COMPONENT
// ==========================================
// Accessible, mobile-friendly input with better validation UX

"use client";

import React, { forwardRef, useState, InputHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// ==========================================
// TYPESCRIPT INTERFACES
// ==========================================

export interface EnhancedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;
  
  /** Error message */
  error?: string;
  
  /** Success message */
  success?: string;
  
  /** Helper text */
  helperText?: string;
  
  /** Input size */
  inputSize?: "sm" | "md" | "lg";
  
  /** Left icon */
  leftIcon?: React.ReactNode;
  
  /** Right icon */
  rightIcon?: React.ReactNode;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Show character count */
  showCount?: boolean;
  
  /** Maximum length */
  maxLength?: number;
  
  /** Container className */
  containerClassName?: string;
}

// ==========================================
// SIZE VARIANTS
// ==========================================

const sizeClasses = {
  sm: "h-9 px-3 py-2 text-sm",
  md: "h-10 px-4 py-2 text-base",
  lg: "h-12 px-5 py-3 text-lg",
};

// ==========================================
// ENHANCED INPUT COMPONENT
// ==========================================

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      inputSize = "md",
      leftIcon,
      rightIcon,
      isLoading,
      showCount,
      maxLength,
      containerClassName,
      className,
      id,
      type = "text",
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [currentLength, setCurrentLength] = useState(
      (props.value as string)?.length || 0
    );

    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Determine input type for password visibility toggle
    const inputType = type === "password" && showPassword ? "text" : type;

    // Handle value change for character count
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (showCount && maxLength) {
        setCurrentLength(e.target.value.length);
      }
      props.onChange?.(e);
    };

    // Determine input state classes
    const hasError = !!error;
    const hasSuccess = !!success && !error;

    return (
      <div className={cn("w-full", containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {label}
            {required && (
              <span className="ml-1 text-red-600 dark:text-red-400" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled || isLoading}
            maxLength={maxLength}
            required={required}
            aria-invalid={hasError}
            aria-describedby={cn(
              hasError && errorId,
              (helperText || hasSuccess) && helperId
            )}
            className={cn(
              // Base styles
              "w-full rounded-lg border transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "dark:bg-gray-800 dark:text-gray-100",
              
              // Size
              sizeClasses[inputSize],
              
              // Padding adjustments for icons
              leftIcon && "pl-10",
              (rightIcon || type === "password" || isLoading || hasError || hasSuccess) && "pr-10",
              
              // State colors
              hasError
                ? "border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400 dark:text-red-100"
                : hasSuccess
                ? "border-green-500 text-green-900 focus:border-green-500 focus:ring-green-500/20 dark:border-green-400 dark:text-green-100"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-600 dark:focus:border-blue-400",
              
              // Disabled state
              disabled && "cursor-not-allowed bg-gray-50 opacity-60 dark:bg-gray-900",
              
              // Loading state
              isLoading && "cursor-wait",
              
              className
            )}
            onChange={handleChange}
            {...props}
          />

          {/* Right Icons Container */}
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {/* Loading Spinner */}
            {isLoading && (
              <svg
                className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-label="Loading"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}

            {/* Error Icon */}
            {hasError && !isLoading && (
              <AlertCircle
                className="h-4 w-4 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
            )}

            {/* Success Icon */}
            {hasSuccess && !isLoading && (
              <CheckCircle2
                className="h-4 w-4 text-green-600 dark:text-green-400"
                aria-hidden="true"
              />
            )}

            {/* Password Toggle */}
            {type === "password" && !isLoading && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn(
                  "touch-target rounded p-1 text-gray-400 transition-colors",
                  "hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
                  "focus-ring"
                )}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            )}

            {/* Custom Right Icon */}
            {rightIcon && !isLoading && !hasError && !hasSuccess && (
              <div className="text-gray-400 dark:text-gray-500">{rightIcon}</div>
            )}
          </div>
        </div>

        {/* Helper Text / Error / Success / Character Count */}
        <div className="mt-2 flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Error Message */}
            {hasError && (
              <p
                id={errorId}
                role="alert"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </p>
            )}

            {/* Success Message */}
            {hasSuccess && (
              <p
                id={helperId}
                className="text-sm text-green-600 dark:text-green-400"
              >
                {success}
              </p>
            )}

            {/* Helper Text */}
            {helperText && !hasError && !hasSuccess && (
              <p
                id={helperId}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                {helperText}
              </p>
            )}
          </div>

          {/* Character Count */}
          {showCount && maxLength && (
            <span
              className={cn(
                "text-sm tabular-nums",
                currentLength > maxLength
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-400"
              )}
              aria-live="polite"
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

// ==========================================
// EXPORT
// ==========================================

export default EnhancedInput;
