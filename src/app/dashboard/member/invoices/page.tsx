/**
 * Member Invoices Page
 * Day 18: Automatic Invoice & Receipt Generation System
 * 
 * Displays all invoices for the current member
 * Features:
 * - Invoice list with filtering
 * - Download functionality
 * - Responsive grid layout
 * - Loading and error states
 * - Toast notifications
 * 
 * @page /dashboard/member/invoices
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useRouter } from 'next/navigation';
import InvoiceCard, { InvoiceCardSkeleton } from '@/components/invoice/InvoiceCard';
import { FileText, Filter, Search } from 'lucide-react';
import { PaymentStatus } from '@prisma/client';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  issuedAt: string;
  pdfUrl?: string | null;
  booking: {
    id: string;
    roomType: {
      name: string;
    };
    startDate: string;
    endDate: string;
  };
}

export default function MemberInvoicesPage() {
  const router = useRouter();
  const { user, isLoading: sessionLoading } = useSessionStore();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check authentication
    if (!sessionLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    // Verify member role
    if (user && user.roleName !== 'MEMBER') {
      router.push('/403');
      return;
    }

    // Fetch invoices
    if (user) {
      fetchInvoices();
    }
  }, [user, sessionLoading, router]);

  const fetchInvoices = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        userId: user.id,
        sortBy: 'issuedAt',
        sortOrder: 'desc',
        limit: '50',
      });

      if (filterStatus !== 'all') {
        queryParams.append('paymentStatus', filterStatus);
      }

      const response = await fetch(`/api/invoices?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.data.invoices);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSuccess = () => {
    setToastMessage('Invoice downloaded successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDownloadError = (error: string) => {
    setToastMessage(error);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoiceNumber
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (sessionLoading || (loading && invoices.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded mb-2 animate-pulse" />
            <div className="h-4 w-96 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <InvoiceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Invoices
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and download all your booking invoices
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  fetchInvoices();
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="SUCCEEDED">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Invoice Grid */}
        {filteredInvoices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Invoices Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : "You don't have any invoices yet. Invoices will appear here after you make a booking."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  userId={user!.id}
                  onDownloadSuccess={handleDownloadSuccess}
                  onDownloadError={handleDownloadError}
                />
              ))}
            </div>
          </>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
