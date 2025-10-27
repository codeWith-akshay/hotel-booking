// ==========================================
// SKELETON LOADER COMPONENTS
// ==========================================
// Reusable skeleton loaders for loading states

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks/useAccessibility";

// ==========================================
// BASE SKELETON
// ==========================================

export interface SkeletonProps {
  /** Skeleton variant */
  variant?: "default" | "shimmer" | "wave";
  
  /** Custom className */
  className?: string;
  
  /** Width */
  width?: string | number;
  
  /** Height */
  height?: string | number;
  
  /** Border radius */
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export function Skeleton({
  variant = "shimmer",
  className,
  width,
  height,
  rounded = "md",
}: SkeletonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const roundedClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  const variantClasses = {
    default: "animate-pulse bg-gray-200 dark:bg-gray-700",
    shimmer: cn(
      "relative overflow-hidden bg-gray-200 dark:bg-gray-700",
      "before:absolute before:inset-0 before:-translate-x-full",
      "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
      !prefersReducedMotion && "before:animate-shimmer"
    ),
    wave: cn(
      "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
      "dark:from-gray-700 dark:via-gray-600 dark:to-gray-700",
      !prefersReducedMotion && "animate-wave",
    ),
  };

  return (
    <div
      className={cn(
        roundedClasses[rounded],
        variantClasses[prefersReducedMotion ? "default" : variant],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// ==========================================
// TEXT SKELETON
// ==========================================

export interface TextSkeletonProps {
  /** Number of lines */
  lines?: number;
  
  /** Line height */
  lineHeight?: "tight" | "normal" | "relaxed";
  
  /** Last line width (percentage) */
  lastLineWidth?: number;
  
  /** Custom className */
  className?: string;
}

export function TextSkeleton({
  lines = 3,
  lineHeight = "normal",
  lastLineWidth = 60,
  className,
}: TextSkeletonProps) {
  const lineHeightClasses = {
    tight: "space-y-2",
    normal: "space-y-3",
    relaxed: "space-y-4",
  };

  return (
    <div className={cn(lineHeightClasses[lineHeight], className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 ? `${lastLineWidth}%` : "100%"}
        />
      ))}
    </div>
  );
}

// ==========================================
// AVATAR SKELETON
// ==========================================

export interface AvatarSkeletonProps {
  /** Avatar size */
  size?: "sm" | "md" | "lg" | "xl";
  
  /** Custom className */
  className?: string;
}

export function AvatarSkeleton({ size = "md", className }: AvatarSkeletonProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <Skeleton
      className={cn(sizeClasses[size], className)}
      rounded="full"
    />
  );
}

// ==========================================
// CARD SKELETON
// ==========================================

export interface CardSkeletonProps {
  /** Show avatar */
  showAvatar?: boolean;
  
  /** Show image */
  showImage?: boolean;
  
  /** Number of text lines */
  lines?: number;
  
  /** Custom className */
  className?: string;
}

export function CardSkeleton({
  showAvatar = true,
  showImage = false,
  lines = 3,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      {/* Image */}
      {showImage && (
        <Skeleton height={200} className="mb-4" rounded="lg" />
      )}

      {/* Header with Avatar */}
      <div className="flex items-start gap-3 mb-4">
        {showAvatar && <AvatarSkeleton />}
        <div className="flex-1 space-y-2">
          <Skeleton height={20} width="60%" />
          <Skeleton height={16} width="40%" />
        </div>
      </div>

      {/* Content */}
      <TextSkeleton lines={lines} />

      {/* Footer */}
      <div className="mt-4 flex gap-2">
        <Skeleton height={36} width={100} rounded="lg" />
        <Skeleton height={36} width={100} rounded="lg" />
      </div>
    </div>
  );
}

// ==========================================
// TABLE SKELETON
// ==========================================

export interface TableSkeletonProps {
  /** Number of rows */
  rows?: number;
  
  /** Number of columns */
  columns?: number;
  
  /** Show header */
  showHeader?: boolean;
  
  /** Custom className */
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700", className)}>
      <table className="w-full">
        {showHeader && (
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="p-4">
                  <Skeleton height={16} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="p-4">
                  <Skeleton height={16} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// BOOKING CARD SKELETON
// ==========================================

export function BookingCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton height={24} width={120} />
        <Skeleton height={20} width={80} rounded="full" />
      </div>

      {/* Dates */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Skeleton height={16} width={16} rounded="full" />
          <Skeleton height={16} width={200} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton height={16} width={16} rounded="full" />
          <Skeleton height={16} width={200} />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Skeleton height={14} width={80} />
          <Skeleton height={18} width={100} />
        </div>
        <div className="space-y-2">
          <Skeleton height={14} width={80} />
          <Skeleton height={18} width={100} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Skeleton height={40} width="100%" rounded="lg" />
      </div>
    </div>
  );
}

// ==========================================
// DASHBOARD STATS SKELETON
// ==========================================

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton height={40} width={40} rounded="lg" />
            <Skeleton height={20} width={60} rounded="full" />
          </div>
          <Skeleton height={32} width={100} className="mb-2" />
          <Skeleton height={16} width={120} />
        </div>
      ))}
    </div>
  );
}

// ==========================================
// CALENDAR SKELETON
// ==========================================

export function CalendarSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton height={28} width={150} />
        <div className="flex gap-2">
          <Skeleton height={36} width={36} rounded="lg" />
          <Skeleton height={36} width={36} rounded="lg" />
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} height={20} />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <Skeleton key={index} height={40} rounded="lg" />
        ))}
      </div>
    </div>
  );
}

// ==========================================
// FORM SKELETON
// ==========================================

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton height={16} width={100} />
          <Skeleton height={44} rounded="lg" />
        </div>
      ))}
      <Skeleton height={44} rounded="lg" />
    </div>
  );
}
