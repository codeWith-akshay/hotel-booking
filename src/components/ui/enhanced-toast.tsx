// ==========================================
// ENHANCED TOAST NOTIFICATIONS
// ==========================================
// Accessible, animated toast notifications with better UX

"use client";

import React, { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks/useAccessibility";

// ==========================================
// TYPESCRIPT INTERFACES
// ==========================================

export type ToastType = "success" | "error" | "warning" | "info";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

// ==========================================
// TOAST CONTEXT
// ==========================================

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// ==========================================
// TOAST PROVIDER
// ==========================================

export function ToastProvider({
  children,
  position = "top-right",
  maxToasts = 5,
}: {
  children: ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => {
      const updated = [...prev, newToast];
      return updated.slice(-maxToasts); // Keep only the last maxToasts
    });

    // Auto-remove after duration
    if (toast.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Convenience methods
  const success = (title: string, description?: string) => {
    addToast({ type: "success", title, description });
  };

  const error = (title: string, description?: string) => {
    addToast({ type: "error", title, description, duration: 7000 });
  };

  const warning = (title: string, description?: string) => {
    addToast({ type: "warning", title, description, duration: 6000 });
  };

  const info = (title: string, description?: string) => {
    addToast({ type: "info", title, description });
  };

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} position={position} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ==========================================
// TOAST CONTAINER
// ==========================================

interface ToastContainerProps {
  toasts: Toast[];
  position: ToastPosition;
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, position, onRemove }: ToastContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof window === "undefined") {
    return null;
  }

  const positionClasses = {
    "top-left": "top-0 left-0 items-start",
    "top-center": "top-0 left-1/2 -translate-x-1/2 items-center",
    "top-right": "top-0 right-0 items-end",
    "bottom-left": "bottom-0 left-0 items-start",
    "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 items-center",
    "bottom-right": "bottom-0 right-0 items-end",
  };

  return createPortal(
    <div
      className={cn(
        "fixed z-[100] flex flex-col gap-2 p-4 pointer-events-none",
        "safe-top safe-bottom safe-left safe-right",
        positionClasses[position]
      )}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
}

// ==========================================
// TOAST ITEM
// ==========================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, prefersReducedMotion ? 0 : 200);
  };

  // Toast type configuration
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
      iconColor: "text-green-600 dark:text-green-400",
      textColor: "text-green-900 dark:text-green-100",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      iconColor: "text-red-600 dark:text-red-400",
      textColor: "text-red-900 dark:text-red-100",
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      textColor: "text-yellow-900 dark:text-yellow-100",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400",
      textColor: "text-blue-900 dark:text-blue-100",
    },
  };

  const config = typeConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg",
        "transition-all duration-200",
        config.bgColor,
        config.borderColor,
        !prefersReducedMotion && !isExiting && "animate-slide-in-right",
        !prefersReducedMotion && isExiting && "animate-fade-out scale-95 opacity-0"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("flex-shrink-0", config.iconColor)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={cn("text-sm font-semibold", config.textColor)}>
              {toast.title}
            </h3>
            {toast.description && (
              <p className={cn("mt-1 text-sm opacity-90", config.textColor)}>
                {toast.description}
              </p>
            )}

            {/* Action Button */}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className={cn(
                  "mt-3 text-sm font-medium underline transition-opacity hover:opacity-80",
                  "focus-ring rounded",
                  config.textColor
                )}
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleRemove}
            className={cn(
              "touch-target flex-shrink-0 rounded-lg p-1 transition-colors",
              "focus-ring",
              config.textColor,
              "hover:bg-black/5 dark:hover:bg-white/5"
            )}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {toast.duration && toast.duration !== Infinity && (
        <div className="h-1 bg-black/10 dark:bg-white/10">
          <div
            className={cn("h-full bg-current", config.iconColor)}
            style={{
              animation: prefersReducedMotion
                ? "none"
                : `shrink ${toast.duration}ms linear`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// Add this to your CSS for the progress bar animation:
/*
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
*/
