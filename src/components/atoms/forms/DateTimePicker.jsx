import {useState} from "react";
import {
    CalendarIcon,
    ChevronDownIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";

/**
 * DateTimePicker Component - A versatile date and time picker component with calendar interface
 *
 * This component provides a comprehensive date/time selection interface with a visual calendar
 * grid, optional time selection, and validation support. Perfect for forms, scheduling,
 * and any date/time input requirements.
 *
 * Common use cases:
 * - Form date inputs (birthdays, start dates, deadlines)
 * - Event scheduling and appointment booking
 * - Date range selection and filtering
 * - Timestamp creation and editing
 * - Report period selection
 *
 * @param {string} label - Label text displayed above the date picker
 * @param {string|Date} value - Current date/time value
 * @param {Function} onChange - Function called when date/time changes: (date) => {}
 * @param {boolean} disabled - Whether the date picker is disabled
 * @param {boolean} required - Whether the date picker is required for form validation
 * @param {string} error - Error message to display (shows red border and error text)
 * @param {string} className - Additional CSS classes for the trigger button
 * @param {boolean} showTime - Whether to show time selection interface
 * @param {string} placeholder - Placeholder text when no date is selected
 * @param {...any} props - Additional button attributes to spread
 *
 * @example
 * // Basic date picker
 * <DateTimePicker
 *   label="Birth Date"
 *   value={birthDate}
 *   onChange={setBirthDate}
 *   required
 * />
 *
 * @example
 * // Date and time picker
 * <DateTimePicker
 *   label="Appointment Time"
 *   value={appointmentTime}
 *   onChange={setAppointmentTime}
 *   showTime
 *   placeholder="Select date and time"
 * />
 *
 * @example
 * // Disabled date picker
 * <DateTimePicker
 *   label="Created Date"
 *   value={createdDate}
 *   disabled
 * />
 *
 * @example
 * // Date picker with validation
 * <DateTimePicker
 *   label="Deadline"
 *   value={deadline}
 *   onChange={setDeadline}
 *   error={errors.deadline}
 *   required
 * />
 */
function DateTimePicker({
                            label,
                            value,
                            onChange,
                            disabled = false,
                            required = false,
                            error = "",
                            className = "",
                            showTime = false,
                            placeholder = "Select date",
                            ...props
                        }) {
    // State for controlling dropdown visibility
    const [isOpen, setIsOpen] = useState(false);

    // State for the currently selected date
    const [selectedDate, setSelectedDate] = useState(value || "");

    // Format date for display in a user-friendly format
    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Handle date selection from calendar grid
    // Updates internal state and calls parent onChange
    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setIsOpen(false);
        onChange(date);
    };

    return (
        // Full-width container for proper form layout
        <div className="w-full">
            {/* Form label with required indicator */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {/* Trigger button that opens the calendar dropdown */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
            w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${disabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"}
            ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}
            ${className}
          `}
                    {...props}
                >
					<span className="flex items-center justify-between">
						{/* Display formatted date or placeholder */}
                        <span className="block truncate">
							{selectedDate ? formatDate(selectedDate) : placeholder}
						</span>
                        {/* Dropdown arrow indicator */}
                        <ChevronDownIcon className="w-4 h-4 text-gray-400"/>
					</span>
                </button>

                {/* Calendar dropdown - Only rendered when open */}
                {isOpen && (
                    <div
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        <div className="p-4">
                            {/* Dropdown header with title and close button */}
                            <div
                                className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {showTime ? "Select Date & Time" : "Select Date"}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                    aria-label="Close date picker"
                                >
                                    <XMarkIcon className="w-5 h-5"/>
                                </button>
                            </div>

                            {/* Calendar Grid - 31 days in 7 columns */}
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({length: 31}, (_, i) => {
                                    const date = new Date(
                                        new Date().getFullYear(),
                                        new Date().getMonth(),
                                        i + 1,
                                    );

                                    // Check if this date is today
                                    const isToday =
                                        date.toDateString() === new Date().toDateString();

                                    // Check if this date is currently selected
                                    const isSelected =
                                        selectedDate && date.toDateString() === selectedDate;

                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleDateSelect(date)}
                                            className={`
                        p-2 text-sm rounded
                        ${isToday ? "bg-blue-100 text-blue-700 font-bold" : "hover:bg-gray-100 text-gray-700"}
                        ${isSelected ? "bg-blue-500 text-white" : "text-gray-900"}
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                      `}
                                        >
                                            <div className="text-center">
                                                {/* Day number */}
                                                <div
                                                    className="text-sm font-medium">
                                                    {date.getDate()}
                                                </div>
                                                {/* Day abbreviation */}
                                                <div
                                                    className="text-xs text-gray-500">
                                                    {date.toLocaleDateString("en-US", {
                                                        weekday: "short",
                                                    })}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Time Selection Grid - Only shown when showTime is true */}
                            {showTime && (
                                <div className="mt-4 pt-4 border-t">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Select Time
                                    </h4>
                                    {/* 24-hour time selection grid */}
                                    <div className="grid grid-cols-6 gap-2">
                                        {Array.from({length: 24}, (_, i) => {
                                            const hour = i.toString().padStart(2, "0");
                                            const isSelected =
                                                selectedDate &&
                                                value &&
                                                new Date(value).getHours() === i;

                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => {
                                                        const newDate = selectedDate
                                                            ? new Date(selectedDate)
                                                            : new Date();
                                                        newDate.setHours(parseInt(hour));
                                                        handleDateSelect(newDate);
                                                    }}
                                                    className={`
                            p-2 text-sm rounded
                            ${isSelected ? "bg-blue-500 text-white" : "hover:bg-gray-100 text-gray-700"}
                            focus:outline-none focus:ring-2 focus:ring-blue-500
                          `}
                                                >
                                                    <div
                                                        className="text-center">
                                                        {/* Hour display */}
                                                        <div
                                                            className="text-lg font-medium">
                                                            {hour}
                                                        </div>
                                                        {/* Minutes display (fixed at :00) */}
                                                        <div
                                                            className="text-xs text-gray-500">
                                                            :00
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Error message display */}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default DateTimePicker;
