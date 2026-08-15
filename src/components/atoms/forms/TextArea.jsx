/**
 * TextArea Component - A versatile textarea component with validation support
 *
 * This component provides a consistent textarea interface for multi-line text input
 * with support for labels, error states, required indicators, and accessibility features.
 * Perfect for forms, comments, descriptions, and any multi-line text requirements.
 *
 * Common use cases:
 * - Comments and feedback forms
 * - Product descriptions and details
 * - Message composition and chat inputs
 * - Bio and profile information
 * - Notes and memo fields
 * - Address and multi-line text fields
 *
 * @param {string} label - Label text displayed above the textarea
 * @param {string} placeholder - Placeholder text displayed when textarea is empty
 * @param {string} value - Current textarea value
 * @param {Function} onChange - Function called when textarea value changes: (event) => {}
 * @param {string} error - Error message to display (shows red border and error text)
 * @param {boolean} disabled - Whether the textarea is disabled
 * @param {boolean} required - Whether the textarea is required for form validation
 * @param {number} rows - Number of visible text lines (default: 4)
 * @param {string} className - Additional CSS classes for the textarea element
 * @param {...any} props - Additional textarea attributes to spread
 *
 * @example
 * // Basic textarea
 * <TextArea
 *   label="Comments"
 *   value={comments}
 *   onChange={(e) => setComments(e.target.value)}
 *   placeholder="Enter your comments here..."
 *   rows={4}
 * />
 *
 * @example
 * // Product description
 * <TextArea
 *   label="Product Description"
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   placeholder="Describe your product in detail..."
 *   rows={6}
 *   required
 *   error={errors.description}
 * />
 *
 * @example
 * // User bio
 * <TextArea
 *   label="Bio"
 *   value={bio}
 *   onChange={(e) => setBio(e.target.value)}
 *   placeholder="Tell us about yourself..."
 *   rows={3}
 *   maxLength={500}
 * />
 *
 * @example
 * // Disabled textarea
 * <TextArea
 *   label="System Notes"
 *   value={systemNotes}
 *   disabled
 *   rows={5}
 * />
 *
 * @example
 * // Message composition
 * <TextArea
 *   label="Message"
 *   value={message}
 *   onChange={(e) => setMessage(e.target.value)}
 *   placeholder="Type your message here..."
 *   rows={8}
 *   required
 * />
 */
function TextArea({
                      label,
                      placeholder = "",
                      value,
                      onChange,
                      error = "",
                      disabled = false,
                      required = false,
                      rows = 4,
                      className = "",
                      ...props
                  }) {
    // Dynamic textarea styling based on state and validation
    const textareaClasses = [
        // Base textarea styling with focus states
        "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",

        // State-based styling
        disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white",

        // Error state styling
        error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "",

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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* Main textarea element with dynamic styling */}
            <textarea
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                rows={rows}
                className={textareaClasses}
                {...props}
            />

            {/* Error message display */}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default TextArea;
