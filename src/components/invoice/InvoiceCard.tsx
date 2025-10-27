/**
 * Invoice Card Component
 * Day 18: Automatic Invoice & Receipt Generation System
 * 
 * Displays invoice details with download functionality
 * Features:
 * - Invoice number and date display
 * - Amount and payment status
 * - Download PDF button
 * - Responsive design
 * - Dark mode support
 * - Loading and error states
 * 
 * @component
 */

'use client';

import React, { useState } from 'react';
import { Download, FileText, Calendar, CreditCard, Check, X, Clock } from 'lucide-react';
import { formatCurrency, formatInvoiceDate, getPaymentStatusLabel, getPaymentStatusColor } from '@/lib/utils/invoiceUtils.client';
import { PaymentStatus } from '@prisma/client';

export interface InvoiceCardProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    issuedAt: Date | string;
    pdfUrl?: string | null;
    booking?: {
      id: string;
      roomType: {
        name: string;
      };
      startDate: Date | string;
      endDate: Date | string;
    };
  };
  userId: string;
  onDownloadSuccess?: () => void;
  onDownloadError?: (error: string) => void;
}

/**
 * InvoiceCard Component
 * Displays invoice information and download button
 */
export default function InvoiceCard({
  invoice,
  userId,
  onDownloadSuccess,
  onDownloadError,
}: InvoiceCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(
        `/api/invoices/${invoice.id}/download?userId=${userId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download invoice');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onDownloadSuccess?.();
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download invoice';
      onDownloadError?.(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'SUCCEEDED':
        return <Check className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'FAILED':
      case 'CANCELLED':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const issuedDate = invoice.issuedAt instanceof Date 
    ? invoice.issuedAt 
    : new Date(invoice.issuedAt);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      {/* Header: Invoice Number and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
            <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {invoice.invoiceNumber}
            </h3>
            {invoice.booking && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {invoice.booking.roomType.name}
              </p>
            )}
          </div>
        </div>

        {/* Payment Status Badge */}
        <div
          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
            invoice.paymentStatus === 'SUCCEEDED'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : invoice.paymentStatus === 'PENDING'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }`}
        >
          {getStatusIcon(invoice.paymentStatus)}
          <span>{getPaymentStatusLabel(invoice.paymentStatus)}</span>
        </div>
      </div>

      {/* Invoice Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Amount */}
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {formatCurrency(invoice.amount, invoice.currency)}
            </p>
          </div>
        </div>

        {/* Issue Date */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Issued</p>
            <p className="text-base text-gray-900 dark:text-white">
              {formatInvoiceDate(issuedDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Dates (if available) */}
      {invoice.booking && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stay Period</p>
          <p className="text-sm text-gray-900 dark:text-white">
            {formatInvoiceDate(
              invoice.booking.startDate instanceof Date
                ? invoice.booking.startDate
                : new Date(invoice.booking.startDate)
            )}{' '}
            -{' '}
            {formatInvoiceDate(
              invoice.booking.endDate instanceof Date
                ? invoice.booking.endDate
                : new Date(invoice.booking.endDate)
            )}
          </p>
        </div>
      )}

      {/* Payment Method */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
        <p className="text-sm text-gray-900 dark:text-white capitalize">
          {invoice.paymentMethod}
        </p>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading || !invoice.pdfUrl}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          invoice.pdfUrl
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
        }`}
      >
        <Download className="h-4 w-4" />
        <span>
          {isDownloading
            ? 'Downloading...'
            : invoice.pdfUrl
            ? 'Download PDF'
            : 'PDF Not Available'}
        </span>
      </button>

      {!invoice.pdfUrl && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          Please contact support if you need this invoice
        </p>
      )}
    </div>
  );
}

/**
 * Invoice Card Skeleton
 * Loading state for invoice card
 */
export function InvoiceCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="h-5 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="h-5 w-28 bg-gray-300 dark:bg-gray-600 rounded" />
        </div>
      </div>

      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-md mb-4" />

      <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg" />
    </div>
  );
}
