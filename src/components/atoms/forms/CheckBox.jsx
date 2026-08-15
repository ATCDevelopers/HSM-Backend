/**
 * CheckBox Component - A versatile checkbox input component with validation support
 *
 * This component provides a consistent checkbox interface throughout the application
 * with support for labels, error states, required indicators, and accessibility features.
 * Perfect for forms, settings panels, and data selection interfaces.
 *
 * Common use cases:
 * - Form inputs for boolean values
 * - Settings toggles and preferences
 * - Multi-select options and filters
 * - Terms and conditions acceptance
 * - Permission and role selections
 *
 * @param {string} label - Label text displayed next to the checkbox
 * @param {boolean} checked - Whether the checkbox is currently checked
 * @param {Function} onChange - Function called when checkbox state changes: (event) => {}
 * @param {boolean} disabled - Whether the checkbox is disabled
 * @param {boolean} required - Whether the checkbox is required for form validation
 * @param {string} error - Error message to display (shows red border and error text)
 * @param {string} className - Additional CSS classes for the checkbox input
 * @param {...any} props - Additional input attributes to spread
 *
 * @example
 * // Basic checkbox
 * <CheckBox
 *   label="I agree to the terms"
 *   checked={agreed}
 *   onChange={(e) => setAgreed(e.target.checked)}
 * />
 *
 * @example
 * // Required checkbox with validation
 * <CheckBox
 *   label="Accept privacy policy"
 *   checked={accepted}
 *   onChange={handleChange}
 *   required
 *   error={errors.privacy}
 * />
 *
 * @example
 * // Disabled checkbox
 * <CheckBox
 *   label="Premium feature"
 *   checked={true}
 *   disabled
 * />
 *
 * @example
 * // Multiple checkboxes for selection
 * <CheckBox
 *   label="Send notifications"
 *   checked={settings.notifications}
 *   onChange={(e) => updateSettings('notifications', e.target.checked)}
 * />
 */
function CheckBox({
                      label,
                      checked,
                      onChange,
                      disabled = false,
                      required = false,
                      error = "",
                      className = "",
                      ...props
                  }) {
    // Dynamic checkbox styling based on state and validation
    const checkboxClasses = [
        // Base checkbox styling
        "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500",

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
            {/* Accessible label wrapping the checkbox input */}
            <label className="flex items-center">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    className={checkboxClasses}
                    {...props}
                />

                {/* Label text with required indicator */}
                {label && (
                    <span className="ml-2 text-sm text-gray-700">
						{label}
                        {required &&
                            <span className="text-red-500 ml-1">*</span>}
					</span>
                )}
            </label>

            {/* Error message display */}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default CheckBox;
