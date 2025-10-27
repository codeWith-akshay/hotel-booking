// ==========================================
// ACCESSIBLE MODAL COMPONENT
// ==========================================
// WCAG 2.1 AA compliant modal with focus trap, keyboard navigation, and smooth animations

"use client";

import React, { useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useFocusTrap, useEscapeKey } from "@/lib/hooks/useAccessibility";
import { usePrefersReducedMotion } from "@/lib/hooks/useAccessibility";
import { cn } from "@/lib/utils";

// ==========================================
// TYPESCRIPT INTERFACES
// ==========================================

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Modal title for screen readers */
  title: string;
  
  /** Modal description for screen readers */
  description?: string;
  
  /** Modal content */
  children: ReactNode;
  
  /** Modal size */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  
  /** Show close button */
  showCloseButton?: boolean;
  
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  
  /** Close on escape key */
  closeOnEscape?: boolean;
  
  /** Additional className for modal content */
  className?: string;
  
  /** Custom footer */
  footer?: ReactNode;
  
  /** Prevent body scroll when open */
  preventScroll?: boolean;
}

// ==========================================
// SIZE VARIANTS
// ==========================================

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full mx-4",
};

// ==========================================
// MODAL COMPONENT
// ==========================================

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  footer,
  preventScroll = true,
}: ModalProps) {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Handle escape key
  useEscapeKey(() => {
    if (closeOnEscape) {
      onClose();
    }
  }, isOpen);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!preventScroll) return;

    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen, preventScroll]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
          !prefersReducedMotion && "animate-fade-in"
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        onClick={handleBackdropClick}
      >
        {/* Modal Content */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby={description ? "modal-description" : undefined}
          className={cn(
            "relative w-full rounded-2xl bg-white shadow-2xl",
            "dark:bg-gray-800 dark:border dark:border-gray-700",
            "max-h-[90vh] overflow-hidden flex flex-col",
            sizeClasses[size],
            !prefersReducedMotion && "animate-scale-in",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-gray-700">
            <div className="flex-1 pr-4">
              <h2
                id="modal-title"
                className="text-xl font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h2>
              {description && (
                <p
                  id="modal-description"
                  className="mt-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  {description}
                </p>
              )}
            </div>

            {/* Close Button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  "touch-target rounded-lg p-2 text-gray-400 transition-colors",
                  "hover:bg-gray-100 hover:text-gray-600",
                  "dark:hover:bg-gray-700 dark:hover:text-gray-300",
                  "focus-ring"
                )}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-gray-200 p-6 dark:border-gray-700">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Render in portal
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}

// ==========================================
// MODAL FOOTER COMPONENT
// ==========================================

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn("flex items-center justify-end gap-3", className)}>
      {children}
    </div>
  );
}

// ==========================================
// CONFIRM DIALOG COMPONENT
// ==========================================

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
      footer={
        <ModalFooter>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "touch-target rounded-lg border border-gray-300 bg-white px-4 py-2",
              "text-sm font-medium text-gray-700 transition-colors",
              "hover:bg-gray-50 focus-ring",
              "dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "touch-target rounded-lg px-4 py-2",
              "text-sm font-medium text-white transition-colors",
              "focus-ring disabled:opacity-50 disabled:cursor-not-allowed",
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            )}
          >
            {isLoading ? (
              <>
                <svg
                  className="inline h-4 w-4 animate-spin mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
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
                Loading...
              </>
            ) : (
              confirmText
            )}
          </button>
        </ModalFooter>
      }
    >
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </Modal>
  );
}

// ==========================================
// EXPORT
// ==========================================

export default Modal;
