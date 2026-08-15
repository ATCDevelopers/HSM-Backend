/**
 * ToggleSwitch Component - A modern toggle switch component with validation support
 *
 * This component provides a visually appealing toggle switch interface for binary
 * on/off selections. Features smooth animations, proper accessibility support,
 * and consistent styling. Perfect for settings, preferences, and any boolean
 * value selection requirements.
 *
 * Common use cases:
 * - Feature toggles and settings switches
 * - Notification preferences (enable/disable)
 * - Privacy settings and permissions
 * - Dark/light theme switching
 * - Auto-save and auto-update options
 * - Account status and active/inactive states
 *
 * @param {string} label - Label text displayed above the toggle switch
 * @param {boolean} checked - Whether the toggle switch is currently on (true) or off (false)
 * @param {Function} onChange - Function called when toggle state changes: (newValue) => {}
 * @param {boolean} disabled - Whether the toggle switch is disabled
 * @param {boolean} required - Whether the toggle selection is required for form validation
 * @param {string} error - Error message to display (shows red ring and error text)
 * @param {string} className - Additional CSS classes for the toggle switch
 * @param {...any} props - Additional button attributes to spread
 *
 * @example
 * // Basic toggle switch
 * <ToggleSwitch
 *   label="Enable Notifications"
 *   checked={notificationsEnabled}
 *   onChange={setNotificationsEnabled}
 * />
 *
 * @example
 * // Dark mode toggle
 * <ToggleSwitch
 *   label="Dark Mode"
 *   checked={darkMode}
 *   onChange={setDarkMode}
 * />
 *
 * @example
 * // Required toggle with validation
 * <ToggleSwitch
 *   label="Accept Terms and Conditions"
 *   checked={termsAccepted}
 *   onChange={setTermsAccepted}
 *   required
 *   error={errors.terms}
 * />
 *
 * @example
 * // Disabled toggle switch
 * <ToggleSwitch
 *   label="Premium Feature"
 *   checked={false}
 *   onChange={() => {}}
 *   disabled
 * />
 *
 * @example
 * // Auto-save toggle
 * <ToggleSwitch
 *   label="Auto-save Changes"
 *   checked={autoSave}
 *   onChange={setAutoSave}
 * />
 */
function ToggleSwitch({
                          label,
                          checked,
                          onChange,
                          disabled = false,
                          required = false,
                          error = "",
                          className = "",
                          ...props
                      }) {
    // Dynamic toggle switch styling based on state and validation
    const switchClasses = [
        // Base toggle switch styling with focus and transition states
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",

        // State-based styling
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",

        // Error state styling
        error ? "ring-red-500" : "",

        // Checked/unchecked background colors
        checked
            ? "bg-blue-600" // Blue when checked
            : "bg-gray-200", // Light gray when unchecked

        // Custom additional classes
        className,
    ]
        .filter(Boolean)
        .join(" ");

    // Dynamic toggle knob styling based on checked state
    const spanClasses = [
        // Base knob styling with transition and shadow
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md",

        // Position and color based on checked state
        checked ? "translate-x-6 bg-blue-600" : "translate-x-1 bg-gray-400",
    ].join(" ");

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

            {/* Toggle switch button with proper ARIA attributes */}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                disabled={disabled}
                className={switchClasses}
                {...props}
            >
                {/* Toggle knob that slides between positions */}
                <span className={spanClasses}/>
            </button>

            {/* Error message display */}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default ToggleSwitch;
