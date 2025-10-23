"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import "react-day-picker/dist/style.css";
import { getRoomAvailability } from "@/actions/rooms/room-inventory.action";
import type { RoomAvailabilityByDate, AvailabilityStatus } from "@/types/room.types";

/**
 * EnhancedBookingCalendar Component
 * 
 * Extended calendar component with dynamic availability indicators.
 * Fetches real-time room availability and displays color-coded status.
 * 
 * Features:
 * - Dynamic availability fetching via server action
 * - Color indicators (green/yellow/red dots) under each date
 * - Tooltip hover info showing available rooms
 * - Loading states with shimmer skeleton
 * - Error handling with retry capability
 * - Responsive mobile layout
 * - Zustand integration for state management
 * - Full TypeScript support
 * 
 * @component
 * @example
 * ```tsx
 * <EnhancedBookingCalendar
 *   roomTypeId="clx123456"
 *   selectedRange={dateRange}
 *   onSelect={setDateRange}
 *   numberOfMonths={2}
 * />
 * ```
 */

// ==========================================
// TYPESCRIPT INTERFACES
// ==========================================

/**
 * Availability data map
 * Maps date strings (YYYY-MM-DD) to availability info
 */
interface AvailabilityMap {
  [dateKey: string]: {
    availableRooms: number;
    status: AvailabilityStatus;
  };
}

/**
 * Component props interface
 */
export interface EnhancedBookingCalendarProps {
  /**
   * Room type ID to fetch availability for
   * Required for availability queries
   */
  roomTypeId: string;

  /**
   * Currently selected date range
   */
  selectedRange: { from: Date; to: Date | null };

  /**
   * Callback when date range changes
   */
  onSelect: (range: { from: Date; to: Date | null }) => void;

  /**
   * Minimum selectable date (defaults to today)
   */
  minDate?: Date;

  /**
   * Maximum selectable date
   */
  maxDate?: Date;

  /**
   * Number of months to display (default: 2 on desktop, 1 on mobile)
   */
  numberOfMonths?: number;

  /**
   * Optional: Array of dates to disable
   */
  disabledDates?: Date[];

  /**
   * Optional: Callback when availability loads
   */
  onAvailabilityLoad?: (availability: RoomAvailabilityByDate[]) => void;

  /**
   * Optional: Callback when errors occur
   */
  onError?: (error: string) => void;
}

/**
 * Loading state enum
 */
type LoadingState = "idle" | "loading" | "success" | "error";

// ==========================================
// AVAILABILITY INDICATOR COMPONENT
// ==========================================

/**
 * DayAvailabilityIndicator
 * Renders color-coded dots and tooltips for each date
 */
interface DayAvailabilityIndicatorProps {
  date: Date;
  availableRooms: number;
  status: AvailabilityStatus;
}

function DayAvailabilityIndicator({
  date,
  availableRooms,
  status,
}: DayAvailabilityIndicatorProps) {
  // Color mapping based on availability status
  const statusColors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  const statusTextColors = {
    green: "text-green-700",
    yellow: "text-yellow-700",
    red: "text-red-700",
  };

  return (
    <div className="group relative">
      {/* Availability dot */}
      <div
        className={`mx-auto mt-0.5 h-1.5 w-1.5 rounded-full ${statusColors[status]} 
        transition-all duration-200 group-hover:scale-150`}
      />
      
      {/* Tooltip on hover */}
      <div
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 
        -translate-x-1/2 scale-0 transform rounded-lg bg-gray-900 px-3 py-2 
        text-xs text-white shadow-lg transition-all duration-200 group-hover:scale-100"
      >
        <div className="font-semibold">{format(date, "MMM dd, yyyy")}</div>
        <div className={`mt-1 font-medium ${statusTextColors[status]}`}>
          {availableRooms > 0 ? (
            <>
              ✓ {availableRooms} room{availableRooms !== 1 ? "s" : ""} available
            </>
          ) : (
            <>✗ Fully booked</>
          )}
        </div>
        {/* Tooltip arrow */}
        <div
          className="absolute left-1/2 top-full -translate-x-1/2 
          border-4 border-transparent border-t-gray-900"
        />
      </div>
    </div>
  );
}

// ==========================================
// LOADING SKELETON COMPONENT
// ==========================================

/**
 * CalendarSkeleton
 * Shimmer loading effect while fetching availability
 * Matches the enhanced design aesthetic
 */
function CalendarSkeleton({ numberOfMonths = 2 }: { numberOfMonths?: number }) {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Date range skeleton */}
      <div className="animate-pulse rounded-xl border-2 border-gray-200 bg-linear-to-r from-gray-100 to-gray-50 p-5 shadow-lg md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-300" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 rounded bg-gray-300" />
              <div className="h-8 w-32 rounded-md bg-gray-300" />
            </div>
          </div>
          <div className="hidden md:block h-6 w-6 rounded bg-gray-300" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-300" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 rounded bg-gray-300" />
              <div className="h-8 w-32 rounded-md bg-gray-300" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Calendar skeleton */}
      <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="bg-linear-to-br from-gray-100 via-gray-50 to-gray-100 p-6 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
            {Array.from({ length: numberOfMonths }).map((_, idx) => (
              <div key={idx} className="flex-1">
                {/* Month header */}
                <div className="mb-5 flex items-center justify-center">
                  <div className="h-7 w-40 rounded-lg bg-gray-300" />
                </div>
                
                {/* Day headers */}
                <div className="mb-3 flex justify-between">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-4 w-8 rounded bg-gray-300" />
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="space-y-1">
                  {Array.from({ length: 5 }).map((_, rowIdx) => (
                    <div key={rowIdx} className="flex justify-between">
                      {Array.from({ length: 7 }).map((_, colIdx) => (
                        <div 
                          key={colIdx} 
                          className="h-10 w-10 rounded-lg bg-gray-200 shadow-sm" 
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend skeleton */}
      <div className="animate-pulse rounded-xl border border-gray-200 bg-linear-to-br from-gray-100 to-gray-50 p-5 shadow-md md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gray-300" />
          <div className="h-5 w-24 rounded bg-gray-300" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-5/6 rounded bg-gray-200" />
          <div className="h-4 w-4/6 rounded bg-gray-200" />
        </div>
        <div className="mt-5 border-t border-gray-300 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gray-300" />
            <div className="h-5 w-32 rounded bg-gray-300" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-200 shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function EnhancedBookingCalendar({
  roomTypeId,
  selectedRange,
  onSelect,
  minDate = new Date(),
  maxDate,
  numberOfMonths = 2,
  disabledDates = [],
  onAvailabilityLoad,
  onError,
}: EnhancedBookingCalendarProps) {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  const [availabilityMap, setAvailabilityMap] = useState<AvailabilityMap>({});
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // ==========================================
  // FETCH AVAILABILITY DATA
  // ==========================================

  /**
   * Fetches availability for the visible month range
   * Triggered on mount and when month changes
   */
  const fetchAvailability = useCallback(async () => {
    if (!roomTypeId) {
      setErrorMessage("Room type ID is required");
      setLoadingState("error");
      return;
    }

    setLoadingState("loading");
    setErrorMessage("");

    try {
      // Calculate date range for visible months
      const rangeStart = startOfMonth(currentMonth);
      const rangeEnd = endOfMonth(addMonths(currentMonth, numberOfMonths - 1));

      // Call server action
      const result = await getRoomAvailability(roomTypeId, rangeStart, rangeEnd);

      if (result.success && result.data) {
        // Build availability map for quick lookups
        const newAvailabilityMap: AvailabilityMap = {};
        
        result.data.forEach((item) => {
          newAvailabilityMap[item.date] = {
            availableRooms: item.availableRooms,
            status: item.status,
          };
        });

        setAvailabilityMap(newAvailabilityMap);
        setLoadingState("success");

        // Notify parent component
        if (onAvailabilityLoad) {
          onAvailabilityLoad(result.data);
        }
      } else {
        const error = result.message || "Failed to fetch availability";
        setErrorMessage(error);
        setLoadingState("error");
        
        if (onError) {
          onError(error);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(message);
      setLoadingState("error");
      
      if (onError) {
        onError(message);
      }
      
      console.error("Error fetching availability:", error);
    }
  }, [roomTypeId, currentMonth, numberOfMonths, onAvailabilityLoad, onError]);

  // ==========================================
  // EFFECTS
  // ==========================================

  /**
   * Fetch availability when component mounts or dependencies change
   */
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  /**
   * Handle date range selection
   */
  const handleSelect = (range: DateRange | undefined) => {
    if (range) {
      onSelect({
        from: range.from || new Date(),
        to: range.to || null,
      });
    } else {
      onSelect({ from: new Date(), to: null });
    }
  };

  /**
   * Handle month navigation
   */
  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  /**
   * Retry loading availability
   */
  const handleRetry = () => {
    fetchAvailability();
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  /**
   * Get modifiers for dates based on availability
   */
  const getModifiers = () => {
    const greenDates: Date[] = [];
    const yellowDates: Date[] = [];
    const redDates: Date[] = [];

    Object.entries(availabilityMap).forEach(([dateKey, availability]) => {
      const date = new Date(dateKey);
      if (availability.status === "green") greenDates.push(date);
      else if (availability.status === "yellow") yellowDates.push(date);
      else if (availability.status === "red") redDates.push(date);
    });

    return {
      highAvailability: greenDates,
      lowAvailability: yellowDates,
      fullyBooked: redDates,
    };
  };

  /**
   * Combine disabled dates
   */
  const allDisabledDates = [
    { before: minDate },
    ...(maxDate ? [{ after: maxDate }] : []),
    ...disabledDates,
  ];

  // ==========================================
  // RENDER
  // ==========================================

  // Show loading skeleton
  if (loadingState === "loading" && Object.keys(availabilityMap).length === 0) {
    return <CalendarSkeleton numberOfMonths={numberOfMonths} />;
  }

  return (
    <div className="enhanced-booking-calendar-wrapper space-y-6 p-4 md:p-6 lg:p-8">
      {/* Error banner */}
      {loadingState === "error" && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl border-2 border-red-200 bg-linear-to-r from-red-50 to-red-100 p-5 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-200 p-2">
                <svg
                  className="h-5 w-5 text-red-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-bold text-red-900">Failed to load availability</p>
                <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold 
              text-white shadow-md transition-all duration-200 hover:bg-red-700 
              hover:shadow-lg active:scale-95"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator for subsequent loads */}
      {loadingState === "loading" && Object.keys(availabilityMap).length > 0 && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 p-4 shadow-md">
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <svg className="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
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
            <span className="font-semibold">Updating availability...</span>
          </div>
        </div>
      )}

      {/* Selected date range display */}
      <div className="rounded-xl border-2 border-blue-100 bg-linear-to-r from-blue-50 to-indigo-50 p-5 shadow-lg transition-all duration-300 hover:shadow-xl md:p-6">
        <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <span className="block text-xs font-medium text-gray-600">Check-in</span>
              <span className="mt-0.5 block rounded-md bg-white px-4 py-2 font-bold text-blue-700 shadow-sm ring-1 ring-blue-200">
                {selectedRange.from
                  ? format(selectedRange.from, "MMM dd, yyyy")
                  : "Select date"}
              </span>
            </div>
          </div>
          
          <div className="hidden md:block">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <span className="block text-xs font-medium text-gray-600">Check-out</span>
              <span className="mt-0.5 block rounded-md bg-white px-4 py-2 font-bold text-indigo-700 shadow-sm ring-1 ring-indigo-200">
                {selectedRange.to
                  ? format(selectedRange.to, "MMM dd, yyyy")
                  : "Select date"}
              </span>
            </div>
          </div>
        </div>

        {/* Number of nights */}
        {selectedRange.from && selectedRange.to && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white shadow-md">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-sm font-bold">
              {Math.ceil(
                (selectedRange.to.getTime() - selectedRange.from.getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{" "}
              night{Math.ceil(
                (selectedRange.to.getTime() - selectedRange.from.getTime()) /
                  (1000 * 60 * 60 * 24)
              ) !== 1 ? "s" : ""} selected
            </span>
          </div>
        )}
      </div>

      {/* Main Calendar */}
      <div className="booking-calendar overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-shadow duration-300 hover:shadow-2xl">
        <div className="bg-linear-to-br from-blue-50 via-white to-indigo-50 p-6 md:p-8">
          <DayPicker
            mode="range"
            selected={{
              from: selectedRange.from,
              to: selectedRange.to || undefined,
            }}
            onSelect={handleSelect}
            disabled={allDisabledDates}
            modifiers={getModifiers()}
            numberOfMonths={numberOfMonths}
            onMonthChange={handleMonthChange}
            className="mx-auto"
            classNames={{
              months: "flex flex-col sm:flex-row gap-6 sm:gap-10",
              month: "flex flex-col gap-5",
              caption: "flex justify-center items-center h-12 relative mb-2",
              caption_label: "text-lg font-bold text-gray-800 tracking-tight",
              nav: "flex items-center gap-1",
              nav_button:
                "inline-flex items-center justify-center rounded-lg w-9 h-9 bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md",
              nav_button_previous: "absolute left-0",
              nav_button_next: "absolute right-0",
              table: "border-collapse w-full border-spacing-1",
              head_row: "flex mb-2",
              head_cell:
                "text-gray-600 w-10 font-semibold text-xs uppercase tracking-wider",
              row: "flex w-full mt-1",
              cell: "relative p-0.5 text-center focus-within:relative focus-within:z-20 group",
              day: "h-10 w-10 rounded-lg p-0 font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border hover:border-blue-300 hover:shadow-sm transition-all duration-200 ease-in-out aria-selected:opacity-100 relative cursor-pointer transform hover:scale-105",
              day_selected:
                "bg-linear-to-br from-blue-500 to-blue-700 text-white font-bold hover:from-blue-600 hover:to-blue-800 hover:text-white focus:from-blue-600 focus:to-blue-800 focus:text-white shadow-md hover:shadow-lg border-0",
              day_today: "bg-gradient-to-br from-gray-100 to-gray-200 font-bold text-gray-900 border border-gray-300 shadow-sm",
              day_outside: "text-gray-300 opacity-40 hover:bg-transparent hover:text-gray-300",
              day_disabled: "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50 hover:bg-gray-200 hover:text-gray-400 hover:border-0 hover:shadow-none hover:scale-100",
              day_range_middle:
                "aria-selected:bg-linear-to-r aria-selected:from-blue-100 aria-selected:to-blue-200 aria-selected:text-blue-900 aria-selected:rounded-none aria-selected:font-semibold",
              day_range_start: "rounded-l-lg aria-selected:shadow-lg",
              day_range_end: "rounded-r-lg aria-selected:shadow-lg",
              day_hidden: "invisible",
            }}
            modifiersClassNames={{
              highAvailability: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-green-500 after:shadow-sm after:transition-transform after:duration-200 hover:after:scale-150",
              lowAvailability: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-yellow-500 after:shadow-sm after:transition-transform after:duration-200 hover:after:scale-150",
              fullyBooked: "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200 hover:text-gray-400 hover:border-0 hover:shadow-none hover:scale-100 after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-red-500 after:shadow-sm",
            }}
            showOutsideDays={false}
            fixedWeeks
          />
        </div>

        {/* Availability tooltips - rendered separately */}
        <div className="availability-tooltips">
          {Object.entries(availabilityMap).map(([dateKey, availability]) => {
            const date = new Date(dateKey);
            return (
              <div
                key={dateKey}
                className="hidden"
                data-date={dateKey}
                data-rooms={availability.availableRooms}
                data-status={availability.status}
              />
            );
          })}
        </div>
      </div>

      {/* Legend and instructions */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-linear-to-br from-gray-50 to-white p-5 shadow-md transition-shadow duration-300 hover:shadow-lg md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-lg bg-blue-100 p-2">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-base font-bold text-gray-800">How to use</p>
        </div>
        
        <ul className="ml-6 space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-600">•</span>
            <span>Click a date to select your <strong className="text-gray-900">check-in</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-600">•</span>
            <span>Click another date to select your <strong className="text-gray-900">check-out</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-600">•</span>
            <span>Hover over dates to see availability details</span>
          </li>
        </ul>
        
        <div className="mt-5 border-t border-gray-200 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <svg className="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-base font-bold text-gray-800">Availability indicators</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md hover:ring-green-300">
              <div className="h-3 w-3 rounded-full bg-green-500 shadow-sm" />
              <div className="flex-1">
                <span className="block text-xs font-semibold text-gray-900">High availability</span>
                <span className="block text-xs text-gray-600">More than 5 rooms</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md hover:ring-yellow-300">
              <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-sm" />
              <div className="flex-1">
                <span className="block text-xs font-semibold text-gray-900">Low availability</span>
                <span className="block text-xs text-gray-600">1 to 5 rooms</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-md hover:ring-red-300">
              <div className="h-3 w-3 rounded-full bg-red-500 shadow-sm" />
              <div className="flex-1">
                <span className="block text-xs font-semibold text-gray-900">Fully booked</span>
                <span className="block text-xs text-gray-600">No rooms available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * INTEGRATION GUIDE
 * 
 * 1. Import the enhanced component:
 *    import EnhancedBookingCalendar from "@/components/Calendar/EnhancedBookingCalendar";
 * 
 * 2. Set up state (or use Zustand store):
 *    const [roomTypeId, setRoomTypeId] = useState("clx123456");
 *    const [dateRange, setDateRange] = useState({ from: new Date(), to: null });
 * 
 * 3. Use the component:
 *    <EnhancedBookingCalendar
 *      roomTypeId={roomTypeId}
 *      selectedRange={dateRange}
 *      onSelect={setDateRange}
 *      numberOfMonths={2}
 *      onAvailabilityLoad={(data) => console.log("Loaded:", data)}
 *      onError={(error) => console.error("Error:", error)}
 *    />
 * 
 * 4. The component will:
 *    - Automatically fetch availability when mounted
 *    - Update when month changes or roomTypeId changes
 *    - Display color-coded indicators under each date
 *    - Show tooltips with room counts on hover
 *    - Handle errors with retry capability
 */
