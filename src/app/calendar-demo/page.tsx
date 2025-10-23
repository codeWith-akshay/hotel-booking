"use client";

import { useState } from "react";
import { BookingCalendar } from "@/components/Calendar";
import { format } from "date-fns";

/**
 * Demo page for the BookingCalendar component
 * Access this at: /calendar-demo
 */
export default function CalendarDemoPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | null;
  }>({
    from: new Date(),
    to: null,
  });

  // Mock unavailable dates (simulate booked dates)
  const unavailableDates = [
    new Date(2025, 9, 25), // Oct 25, 2025
    new Date(2025, 9, 26), // Oct 26, 2025
    new Date(2025, 9, 30), // Oct 30, 2025
    new Date(2025, 10, 5), // Nov 5, 2025
  ];

  const calculateNights = () => {
    if (!dateRange.from || !dateRange.to) return 0;
    return Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const resetDates = () => {
    setDateRange({ from: new Date(), to: null });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            📅 BookingCalendar Component Demo
          </h1>
          <p className="text-gray-600">
            A modern, responsive calendar for hotel booking systems
          </p>
        </div>

        {/* Main Demo Card */}
        <div className="rounded-2xl bg-white p-6 shadow-xl md:p-8">
          {/* Calendar Component */}
          <BookingCalendar
            selectedRange={dateRange}
            onSelect={setDateRange}
            minDate={new Date()}
            maxDate={new Date(new Date().setMonth(new Date().getMonth() + 6))}
            disabledDates={unavailableDates}
            numberOfMonths={2}
          />

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={resetDates}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
            >
              Reset Dates
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                setDateRange({ from: today, to: nextWeek });
              }}
              className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200"
            >
              Quick: 1 Week from Today
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const weekend = new Date(today);
                weekend.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
                const mondayAfter = new Date(weekend);
                mondayAfter.setDate(weekend.getDate() + 3);
                setDateRange({ from: weekend, to: mondayAfter });
              }}
              className="rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-200"
            >
              Quick: Next Weekend
            </button>
          </div>
        </div>

        {/* Selected Dates Display */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Selected Dates (State)
          </h2>
          <div className="rounded-lg bg-gray-50 p-4 font-mono text-sm">
            <pre className="overflow-x-auto">
              {JSON.stringify(
                {
                  from: dateRange.from
                    ? format(dateRange.from, "yyyy-MM-dd")
                    : null,
                  to: dateRange.to
                    ? format(dateRange.to, "yyyy-MM-dd")
                    : null,
                  nights: calculateNights(),
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* Features Card */}
          <div className="rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              ✨ Features
            </h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Date range selection (check-in → check-out)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Mobile responsive (2 months → 1 month)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Disabled dates (booked/unavailable)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Min/max date constraints</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Hover effects & animations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Keyboard accessible (WCAG compliant)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>TypeScript & full type safety</span>
              </li>
            </ul>
          </div>

          {/* Usage Card */}
          <div className="rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              🚀 Quick Start
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 font-medium text-gray-700">1. Import:</p>
                <code className="block rounded bg-gray-100 p-2 text-xs">
                  import {"{"} BookingCalendar {"}"} from
                  "@/components/Calendar";
                </code>
              </div>
              <div>
                <p className="mb-1 font-medium text-gray-700">2. Add State:</p>
                <code className="block rounded bg-gray-100 p-2 text-xs">
                  const [dates, setDates] = useState({"{"}from: new Date(), to:
                  null{"}"});
                </code>
              </div>
              <div>
                <p className="mb-1 font-medium text-gray-700">3. Use:</p>
                <code className="block rounded bg-gray-100 p-2 text-xs">
                  {"<BookingCalendar selectedRange={dates} onSelect={setDates} />"}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-6 rounded-2xl bg-linear-to-r from-blue-500 to-indigo-600 p-6 text-white shadow-xl">
          <h2 className="mb-2 text-xl font-semibold">📚 Full Documentation</h2>
          <p className="mb-4 text-sm text-blue-100">
            Check out the complete README for advanced usage, API integration,
            and customization examples.
          </p>
          <code className="block rounded bg-white/20 p-3 text-sm backdrop-blur">
            src/components/Calendar/README.md
          </code>
        </div>
      </div>
    </div>
  );
}
