/**
 * Radio Component - A radio button group component with validation support
 *
 * This component provides a consistent radio button interface for selecting
 * one option from a list of choices. Perfect for forms, surveys, and any
 * single-selection requirements with proper accessibility support.
 *
 * Common use cases:
 * - Gender selection (Male, Female, Other)
 * - Payment methods (Credit Card, PayPal, Bank Transfer)
 * - Shipping options (Standard, Express, Overnight)
 * - Preference settings (Yes/No, Enable/Disable)
 * - Survey questions and polls
 * - Account types (Personal, Business, Enterprise)
 *
 * @param {string} label - Label text displayed above the radio group
 * @param {Array} options - Array of option objects: [{ value: string, label: string }]
 * @param {string} value - Currently selected radio value
 * @param {Function} onChange - Function called when radio selection changes: (value) => {}
 * @param {boolean} disabled - Whether all radio buttons are disabled
 * @param {boolean} required - Whether radio selection is required for form validation
 * @param {string} error - Error message to display (shows red border and error text)
 * @param {string} className - Additional CSS classes for radio buttons
 * @param {...any} props - Additional input attributes to spread
 *
 * @example
 * // Basic radio group
 * <Radio
 *   label="Gender"
 *   options={[
 *     { value: "male", label: "Male" },
 *     { value: "female", label: "Female" },
 *     { value: "other", label: "Other" }
 *   ]}
 *   value={gender}
 *   onChange={setGender}
 *   required
 * />
 *
 * @example
 * // Payment method selection
 * <Radio
 *   label="Payment Method"
 *   options={[
 *     { value: "credit_card", label: "Credit Card" },
 *     { value: "paypal", label: "PayPal" },
 *     { value: "bank_transfer", label: "Bank Transfer" }
 *   ]}
 *   value={paymentMethod}
 *   onChange={setPaymentMethod}
 *   error={errors.paymentMethod}
 * />
 *
 * @example
 * // Yes/No toggle
 * <Radio
 *   label="Enable Notifications"
 *   options={[
 *     { value: "yes", label: "Yes, enable notifications" },
 *     { value: "no", label: "No, keep notifications disabled" }
 *   ]}
 *   value={notificationsEnabled}
 *   onChange={setNotificationsEnabled}
 * />
 *
 * @example
 * // Disabled radio group
 * <Radio
 *   label="Account Type"
 *   options={[
 *     { value: "personal", label: "Personal Account" },
 *     { value: "business", label: "Business Account" }
 *   ]}
 *   value={accountType}
 *   onChange={setAccountType}
 *   disabled
 * />
 */
function Radio({
                   label,
                   options = [],
                   value,
                   onChange,
                   disabled = false,
                   required = false,
                   error = "",
                   className = "",
                   ...props
               }) {
    // Dynamic radio button styling based on state and validation
    const radioClasses = [
        // Base radio button styling with focus states
        "h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500",

        // State-based styling
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",

        // Error state styling
        error ? "border-red-500 focus:ring-red-500" : "",

        // Custom additional classes
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        // Full-width container for proper form layout
        <div className="w-full">
            {/* Form label with required indicator */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Radio button options container */}
            <div className="space-y-2">
                {options.map((option, index) => (
                    // Individual radio option with accessible label
                    <label key={option.value || index}
                           className="flex items-center">
                        {/* Radio button input */}
                        <input
                            type="radio"
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                            disabled={disabled}
                            required={required}
                            className={radioClasses}
                            {...props}
                        />
                        {/* Option label */}
                        <span
                            className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                ))}
            </div>

            {/* Error message display */}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default Radio;
