"use client";

import React from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";

/**
 * BookingCalendar Component
 * 
 * A reusable calendar component for hotel room booking with date range selection.
 * Built with react-day-picker for robust date handling and Tailwind CSS for styling.
 * 
 * @component
 * @example
 * // Basic usage in a booking form:
 * const [dateRange, setDateRange] = useState<{ from: Date; to: Date | null }>({
 *   from: new Date(),
 *   to: null
 * });
 * 
 * <BookingCalendar
 *   selectedRange={dateRange}
 *   onSelect={setDateRange}
 * />
 */

// Props interface for type safety and developer experience
export interface BookingCalendarProps {
  /**
   * The currently selected date range
   * from: Check-in date (required when range is set)
   * to: Check-out date (null if only check-in is selected)
   */
  selectedRange: { from: Date; to: Date | null };

  /**
   * Callback fired when user selects/changes dates
   * Receives the new date range object
   */
  onSelect: (range: { from: Date; to: Date | null }) => void;

  /**
   * Optional: Minimum date that can be selected
   * Defaults to today (prevents booking past dates)
   */
  minDate?: Date;

  /**
   * Optional: Maximum date that can be selected
   * Useful for limiting advance bookings
   */
  maxDate?: Date;

  /**
   * Optional: Array of dates to disable (e.g., fully booked dates)
   */
  disabledDates?: Date[];

  /**
   * Optional: Number of months to display
   * Defaults to 2 on desktop, 1 on mobile
   */
  numberOfMonths?: number;
}

export default function BookingCalendar({
  selectedRange,
  onSelect,
  minDate = new Date(), // Default: can't select past dates
  maxDate,
  disabledDates = [],
  numberOfMonths = 2,
}: BookingCalendarProps) {
  /**
   * Handle date range selection
   * DayPicker returns DateRange | undefined, we normalize it to our format
   */
  const handleSelect = (range: DateRange | undefined) => {
    if (range) {
      onSelect({
        from: range.from || new Date(),
        to: range.to || null,
      });
    } else {
      // User clicked to deselect
      onSelect({ from: new Date(), to: null });
    }
  };

  /**
   * Combine disabled dates with past dates
   * This prevents users from selecting unavailable dates
   */
  const allDisabledDates = [
    { before: minDate }, // Disable all dates before minDate
    ...(maxDate ? [{ after: maxDate }] : []), // Disable dates after maxDate if provided
    ...disabledDates, // Disable specific dates (e.g., fully booked)
  ];

  return (
    <div className="booking-calendar-wrapper">
      {/* 
        Display selected date range above calendar
        Useful for user confirmation of their selection
      */}
      <div className="mb-4 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
        <div className="flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Check-in:</span>
            <span className="rounded-md bg-white px-3 py-1 font-semibold text-blue-600 shadow-sm">
              {selectedRange.from
                ? format(selectedRange.from, "MMM dd, yyyy")
                : "Select date"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Check-out:</span>
            <span className="rounded-md bg-white px-3 py-1 font-semibold text-indigo-600 shadow-sm">
              {selectedRange.to
                ? format(selectedRange.to, "MMM dd, yyyy")
                : "Select date"}
            </span>
          </div>
        </div>

        {/* Calculate and display number of nights */}
        {selectedRange.from && selectedRange.to && (
          <div className="mt-2 text-center text-xs text-gray-600">
            {Math.ceil(
              (selectedRange.to.getTime() - selectedRange.from.getTime()) /
                (1000 * 60 * 60 * 24)
            )}{" "}
            night(s) selected
          </div>
        )}
      </div>

      {/* 
        Main Calendar Component
        Custom Tailwind classes for modern styling
      */}
      <div className="booking-calendar rounded-xl border border-gray-200 bg-white p-4 shadow-lg md:p-6">
        <DayPicker
          mode="range" // Enable range selection (check-in to check-out)
          selected={{
            from: selectedRange.from,
            to: selectedRange.to || undefined,
          }}
          onSelect={handleSelect}
          disabled={allDisabledDates}
          numberOfMonths={numberOfMonths}
          // Responsive: show 1 month on mobile, 2 on desktop
          className="mx-auto"
          classNames={{
            // Custom Tailwind classes for each calendar element
            months: "flex flex-col sm:flex-row gap-4 sm:gap-8",
            month: "flex flex-col gap-4",
            caption: "flex justify-center items-center h-10 relative",
            caption_label: "text-base font-semibold text-gray-900",
            nav: "flex items-center gap-1",
            nav_button:
              "inline-flex items-center justify-center rounded-md w-8 h-8 bg-transparent hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            nav_button_previous: "absolute left-0",
            nav_button_next: "absolute right-0",
            table: "border-collapse w-full",
            head_row: "flex",
            head_cell:
              "text-gray-500 w-9 font-medium text-sm uppercase tracking-wide",
            row: "flex w-full mt-2",
            cell: "relative p-0 text-center focus-within:relative focus-within:z-20",
            day: "h-9 w-9 rounded-md p-0 font-normal hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 aria-selected:opacity-100",
            day_selected:
              "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white",
            day_today: "bg-gray-100 font-semibold text-gray-900",
            day_outside: "text-gray-400 opacity-50",
            day_disabled: "text-gray-300 line-through cursor-not-allowed",
            day_range_middle:
              "aria-selected:bg-blue-100 aria-selected:text-blue-900",
            day_range_start: "rounded-l-md",
            day_range_end: "rounded-r-md",
            day_hidden: "invisible",
          }}
          // Show navigation buttons
          showOutsideDays={false}
          fixedWeeks
        />
      </div>

      {/* 
        Instructions/Legend for users
        Helps users understand how to interact with the calendar
      */}
      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <p className="font-medium text-gray-700">📅 How to use:</p>
        <ul className="ml-4 mt-1 list-disc space-y-1">
          <li>Click a date to select your <strong>check-in</strong></li>
          <li>Click another date to select your <strong>check-out</strong></li>
          <li>
            Dates highlighted in <span className="text-blue-600">blue</span> are selected
          </li>
          <li>
            Dates with <span className="line-through">strikethrough</span> are unavailable
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * INTEGRATION GUIDE
 * 
 * 1. Import the component in your booking form:
 *    import BookingCalendar from "@/components/Calendar/BookingCalendar";
 * 
 * 2. Add state to manage the date range:
 *    const [bookingDates, setBookingDates] = useState<{
 *      from: Date;
 *      to: Date | null;
 *    }>({
 *      from: new Date(),
 *      to: null,
 *    });
 * 
 * 3. Use the component in your form:
 *    <BookingCalendar
 *      selectedRange={bookingDates}
 *      onSelect={setBookingDates}
 *      minDate={new Date()} // Prevent past dates
 *      maxDate={new Date(new Date().setMonth(new Date().getMonth() + 6))} // 6 months ahead
 *      disabledDates={fullyBookedDates} // Array of unavailable dates from API
 *      numberOfMonths={2} // Show 2 months side-by-side
 *    />
 * 
 * 4. Access the dates in your form submission:
 *    const handleSubmit = () => {
 *      const checkIn = bookingDates.from;
 *      const checkOut = bookingDates.to;
 *      // Send to API...
 *    };
 * 
 * 5. Fetch unavailable dates from your backend:
 *    const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
 *    
 *    useEffect(() => {
 *      fetch('/api/rooms/123/availability')
 *        .then(res => res.json())
 *        .then(data => setUnavailableDates(data.bookedDates.map(d => new Date(d))));
 *    }, []);
 * 
 * 6. Customize styling by modifying the classNames object or wrapper styles
 */
