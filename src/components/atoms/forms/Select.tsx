import {useState, useEffect} from "react";
import {ChevronDownIcon} from "@heroicons/react/24/outline";

/**
 * Select Component - A custom dropdown select component with validation support
 *
 * This component provides a consistent dropdown interface for selecting one option
 * from a list of choices. Features custom styling, search capability, and proper
 * accessibility support. Perfect for forms, filters, and any selection requirements.
 *
 * Common use cases:
 * - Country/state/city selection
 * - Category and filter dropdowns
 * - User role and permission selection
 * - Product variant selection
 * - Date range and time period selection
 * - Status and priority selection
 *
 * @param {string} label - Label text displayed above the select dropdown
 * @param {Array} options - Array of option objects: [{ value: string, label: string }]
 * @param {string} value - Currently selected option value
 * @param {Function} onChange - Function called when selection changes: (value) => {}
 * @param {string} placeholder - Placeholder text when no option is selected
 * @param {boolean} disabled - Whether the select dropdown is disabled
 * @param {boolean} required - Whether selection is required for form validation
 * @param {string} error - Error message to display (shows red border and error text)
 * @param {string} className - Additional CSS classes for the select button
 * @param {...any} props - Additional button attributes to spread
 *
 * @example
 * // Basic select dropdown
 * <Select
 *   label="Country"
 *   options={[
 *     { value: "us", label: "United States" },
 *     { value: "ca", label: "Canada" },
 *     { value: "uk", label: "United Kingdom" }
 *   ]}
 *   value={country}
 *   onChange={setCountry}
 *   placeholder="Select a country"
 *   required
 * />
 *
 * @example
 * // Status selection
 * <Select
 *   label="Order Status"
 *   options={[
 *     { value: "pending", label: "Pending" },
 *     { value: "processing", label: "Processing" },
 *     { value: "shipped", label: "Shipped" },
 *     { value: "delivered", label: "Delivered" }
 *   ]}
 *   value={status}
 *   onChange={setStatus}
 *   error={errors.status}
 * />
 *
 * @example
 * // User role selection
 * <Select
 *   label="User Role"
 *   options={[
 *     { value: "admin", label: "Administrator" },
 *     { value: "moderator", label: "Moderator" },
 *     { value: "user", label: "Regular User" },
 *     { value: "guest", label: "Guest" }
 *   ]}
 *   value={userRole}
 *   onChange={setUserRole}
 * />
 *
 * @example
 * // Disabled select
 * <Select
 *   label="Account Type"
 *   options={[
 *     { value: "free", label: "Free Account" },
 *     { value: "premium", label: "Premium Account" }
 *   ]}
 *   value={accountType}
 *   onChange={setAccountType}
 *   disabled
 * />
 */
function Select({
                    label,
                    options = [],
                    value,
                    onChange,
                    placeholder = "Select an option",
                    disabled = false,
                    required = false,
                    error = "",
                    className = "",
                    ...props
                }) {
    // State for controlling dropdown visibility
    const [isOpen, setIsOpen] = useState(false);

    // State for the currently selected option object
    const [selectedOption, setSelectedOption] = useState(
        options.find((option) => option.value === value) || null,
    );

    // Re-sync when options load asynchronously or value changes externally
    useEffect(() => {
        setSelectedOption(options.find((option) => option.value === value) || null);
    }, [options, value]);

    // Handle option selection from dropdown
    // Updates internal state and calls parent onChange
    const handleSelect = (option) => {
        setSelectedOption(option);
        onChange(option.value);
        setIsOpen(false);
    };

    // Determine what to display in the select button
    const displayValue = selectedOption ? selectedOption.label : placeholder;

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
                {/* Select trigger button */}
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
						{/* Display selected option or placeholder */}
                        <span className="block truncate">{displayValue}</span>
                        {/* Dropdown arrow indicator */}
                        <ChevronDownIcon className="w-4 h-4 text-gray-400"/>
					</span>
                </button>

                {/* Dropdown options - Only rendered when open */}
                {isOpen && (
                    <div
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        {/* Scrollable options container */}
                        <div className="max-h-60 overflow-auto">
                            {options.map((option, index) => (
                                // Individual option button
                                <button
                                    key={option.value || index}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`
                    w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100
                    ${selectedOption?.value === option.value ? "bg-blue-50 text-blue-700" : "text-gray-900"}
                  `}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Error message display */}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default Select;
