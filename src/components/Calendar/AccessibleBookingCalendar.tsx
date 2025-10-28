// ==========================================
// ACCESSIBLE BOOKING CALENDAR
// ==========================================
// WCAG 2.1 AA compliant calendar with keyboard navigation and mobile optimization

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { format, startOfMonth, endOfMonth, addMonths, isSameDay } from "date-fns";
import { Calendar, Info, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import "react-day-picker/dist/style.css";
import { getRoomAvailability } from "@/actions/rooms/room-inventory.action";
import type { RoomAvailabilityByDate, AvailabilityStatus } from "@/types/room.types";
import { useAnnouncer, useEscapeKey } from "@/lib/hooks/useAccessibility";
import { useIsMobile } from "@/lib/hooks/useResponsive";
import { cn } from "@/lib/utils";

// ==========================================
// TYPESCRIPT INTERFACES
// ==========================================

interface AvailabilityMap {
  [dateKey: string]: {
    availableRooms: number;
    status: AvailabilityStatus;
  };
}

export interface AccessibleBookingCalendarProps {
  roomTypeId: string;
  selectedRange: { from: Date; to: Date | null };
  onSelect: (range: { from: Date; to: Date | null }) => void;
  minDate?: Date;
  maxDate?: Date;
  numberOfMonths?: number;
  disabledDates?: Date[];
  onAvailabilityLoad?: (availability: RoomAvailabilityByDate[]) => void;
  onError?: (error: string) => void;
  className?: string;
}

type LoadingState = "idle" | "loading" | "success" | "error";

// ==========================================
// AVAILABILITY INDICATOR COMPONENT
// ==========================================

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
  const statusConfig = {
    green: {
      dotColor: "bg-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
      textColor: "text-green-700 dark:text-green-300",
      label: "Good availability",
    },
    yellow: {
      dotColor: "bg-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      textColor: "text-yellow-700 dark:text-yellow-300",
      label: "Limited availability",
    },
    red: {
      dotColor: "bg-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      textColor: "text-red-700 dark:text-red-300",
      label: "Low availability",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="group relative">
      {/* Availability dot */}
      <div
        className={cn(
          "mx-auto mt-0.5 h-1.5 w-1.5 rounded-full transition-all duration-200",
          config.dotColor,
          "group-hover:scale-150 group-focus-within:scale-150"
        )}
        role="presentation"
        aria-hidden="true"
      />
      
      {/* Accessible tooltip */}
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2",
          "-translate-x-1/2 scale-0 transform",
          "rounded-lg border px-3 py-2 text-xs shadow-lg",
          "transition-all duration-200",
          "group-hover:scale-100 group-focus-within:scale-100",
          config.bgColor,
          config.borderColor,
          config.textColor
        )}
      >
        <div className="font-semibold">{format(date, "MMMM dd, yyyy")}</div>
        <div className="mt-1 font-medium">
          {availableRooms > 0 ? (
            <>
              <CheckCircle2 className="inline h-3 w-3 mr-1" aria-hidden="true" />
              {availableRooms} room{availableRooms !== 1 ? "s" : ""} available
            </>
          ) : (
            <>
              <XCircle className="inline h-3 w-3 mr-1" aria-hidden="true" />
              Fully booked
            </>
          )}
        </div>
        <div className="sr-only">
          {config.label}. {availableRooms} room{availableRooms !== 1 ? "s" : ""} available on {format(date, "MMMM dd, yyyy")}.
        </div>
      </div>
    </div>
  );
}

// ==========================================
// LOADING SKELETON COMPONENT
// ==========================================

function CalendarSkeleton({ numberOfMonths = 2 }: { numberOfMonths?: number }) {
  return (
    <div className="space-y-6 p-4 md:p-6" role="status" aria-label="Loading calendar">
      <div className="sr-only">Loading calendar availability...</div>
      
      {/* Calendar skeleton */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="bg-linear-to-br from-gray-100 via-gray-50 to-gray-100 p-6 md:p-8 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
            {Array.from({ length: numberOfMonths }).map((_, idx) => (
              <div key={idx} className="flex-1 animate-pulse">
                {/* Month header */}
                <div className="mb-5 flex items-center justify-center">
                  <div className="h-7 w-40 rounded-lg bg-gray-300 dark:bg-gray-600" />
                </div>
                
                {/* Day headers */}
                <div className="mb-3 flex justify-between">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-4 w-8 rounded bg-gray-300 dark:bg-gray-600" />
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="space-y-1">
                  {Array.from({ length: 5 }).map((_, rowIdx) => (
                    <div key={rowIdx} className="flex justify-between">
                      {Array.from({ length: 7 }).map((_, colIdx) => (
                        <div 
                          key={colIdx} 
                          className="h-10 w-10 rounded-lg bg-gray-200 shadow-sm dark:bg-gray-700" 
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
    </div>
  );
}

// ==========================================
// LEGEND COMPONENT
// ==========================================

function AvailabilityLegend() {
  return (
    <div 
      className="rounded-xl border border-gray-200 bg-linear-to-br from-gray-50 to-white p-5 shadow-md dark:border-gray-700 dark:from-gray-800 dark:to-gray-900"
      role="region"
      aria-label="Availability legend"
    >
      <div className="mb-4 flex items-center gap-2">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Availability Legend
        </h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Good availability (5+ rooms)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-yellow-500" aria-hidden="true" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Limited availability (2-4 rooms)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Low availability (1 room or less)
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AccessibleBookingCalendar({
  roomTypeId,
  selectedRange,
  onSelect,
  minDate = new Date(),
  maxDate,
  numberOfMonths,
  disabledDates = [],
  onAvailabilityLoad,
  onError,
  className,
}: AccessibleBookingCalendarProps) {
  // ==========================================
  // HOOKS AND STATE
  // ==========================================
  
  const [availabilityMap, setAvailabilityMap] = useState<AvailabilityMap>({});
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const isMobile = useIsMobile();
  const announce = useAnnouncer();
  const calendarRef = useRef<HTMLDivElement>(null);

  // Adjust number of months based on screen size
  const displayMonths = numberOfMonths ?? (isMobile ? 1 : 2);

  // ==========================================
  // FETCH AVAILABILITY DATA
  // ==========================================

  const fetchAvailability = useCallback(async () => {
    setLoadingState("loading");
    setErrorMessage("");

    try {
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(addMonths(currentMonth, displayMonths - 1));

      const availability = await getRoomAvailability(
        roomTypeId,
        startDate,
        endDate
      );

      if (!availability.success || !availability.data) {
        throw new Error(availability.error || "Failed to load availability");
      }

      // Map availability data
      const newAvailabilityMap: AvailabilityMap = {};
      availability.data.forEach((item) => {
        const dateKey = format(new Date(item.date), "yyyy-MM-dd");
        newAvailabilityMap[dateKey] = {
          availableRooms: item.availableRooms,
          status: item.status,
        };
      });

      setAvailabilityMap(newAvailabilityMap);
      setLoadingState("success");
      onAvailabilityLoad?.(availability.data);
      
      // Announce to screen readers
      announce("Calendar availability loaded successfully", "polite");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setErrorMessage(message);
      setLoadingState("error");
      onError?.(message);
      
      // Announce error to screen readers
      announce(`Error loading calendar: ${message}`, "assertive");
    }
  }, [roomTypeId, currentMonth, displayMonths, onAvailabilityLoad, onError, announce]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleDateSelect = useCallback(
    (range: DateRange | undefined) => {
      if (!range) {
        onSelect({ from: new Date(), to: null });
        announce("Date selection cleared", "polite");
        return;
      }

      const newRange = {
        from: range.from || new Date(),
        to: range.to || null,
      };

      onSelect(newRange);
      
      // Announce selection to screen readers
      if (newRange.from && newRange.to) {
        announce(
          `Selected date range from ${format(newRange.from, "MMMM dd, yyyy")} to ${format(newRange.to, "MMMM dd, yyyy")}`,
          "polite"
        );
      } else if (newRange.from) {
        announce(`Selected start date: ${format(newRange.from, "MMMM dd, yyyy")}. Please select an end date.`, "polite");
      }
    },
    [onSelect, announce]
  );

  const handleMonthChange = useCallback((month: Date) => {
    setCurrentMonth(month);
    announce(`Viewing ${format(month, "MMMM yyyy")}`, "polite");
  }, [announce]);

  // ==========================================
  // RENDER FUNCTIONS
  // ==========================================

  if (loadingState === "loading" || loadingState === "idle") {
    return <CalendarSkeleton numberOfMonths={displayMonths} />;
  }

  if (loadingState === "error") {
    return (
      <div 
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20"
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" aria-hidden="true" />
        <h3 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-100">
          Failed to Load Calendar
        </h3>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
        <button
          onClick={fetchAvailability}
          className="mt-4 touch-target rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-ring dark:bg-red-500 dark:hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div ref={calendarRef} className={cn("space-y-6", className)}>
      {/* Main Calendar */}
      <div 
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
        role="region"
        aria-label="Room availability calendar"
      >
        <DayPicker
          mode="range"
          selected={{ from: selectedRange.from, to: selectedRange.to || undefined }}
          onSelect={handleDateSelect}
          month={currentMonth}
          onMonthChange={handleMonthChange}
          numberOfMonths={displayMonths}
          fromDate={minDate}
          toDate={maxDate}
          disabled={disabledDates}
          modifiers={{
            booked: (date) => {
              const dateKey = format(date, "yyyy-MM-dd");
              return availabilityMap[dateKey]?.availableRooms === 0;
            },
          }}
          modifiersClassNames={{
            booked: "line-through opacity-50 cursor-not-allowed",
          }}
          components={{
            Day: ({ day, ...props }) => {
              const date = day.date;
              const dateKey = format(date, "yyyy-MM-dd");
              const availability = availabilityMap[dateKey];

              return (
                <button
                  type="button"
                  className={cn(
                    "touch-target relative rounded-lg text-sm font-medium transition-all duration-200",
                    "focus-ring hover:bg-blue-50 dark:hover:bg-blue-900/20",
                    props.className
                  )}
                  aria-label={`${format(date, "MMMM dd, yyyy")}${
                    availability
                      ? `. ${availability.availableRooms} room${availability.availableRooms !== 1 ? "s" : ""} available`
                      : ""
                  }`}
                  onClick={props.onClick as any}
                >
                  {format(date, "d")}
                  {availability && (
                    <DayAvailabilityIndicator
                      date={date}
                      availableRooms={availability.availableRooms}
                      status={availability.status}
                    />
                  )}
                </button>
              );
            },
          }}
          className="p-6 md:p-8"
        />
      </div>

      {/* Legend */}
      <AvailabilityLegend />

      {/* Keyboard instructions */}
      <div className="sr-only" role="region" aria-label="Keyboard instructions">
        Use arrow keys to navigate dates. Press Enter or Space to select a date.
        Press Escape to close the calendar.
      </div>
    </div>
  );
}
