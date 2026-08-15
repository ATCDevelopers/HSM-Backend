import {
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * Alert Component - A versatile alert/notification component for user feedback
 *
 * This component provides four alert types with distinct visual styling:
 * - info: Blue styling for informational messages
 * - success: Green styling for successful operations
 * - warning: Yellow styling for cautionary messages
 * - error: Red styling for error messages
 *
 * Common use cases:
 * - Form validation feedback
 * - API operation results (success/error messages)
 * - System notifications and warnings
 * - User action confirmations
 *
 * @param {React.ReactNode} children - The alert message/content to display
 * @param {string} type - Alert type: "info", "success", "warning", "error"
 * @param {boolean} dismissible - Whether to show a dismiss button
 * @param {Function} onDismiss - Callback function when dismiss button is clicked
 * @param {string} className - Additional CSS classes
 *
 * @example
 * // Success message with auto-dismiss
 * <Alert type="success" dismissible onDismiss={() => setShowAlert(false)}>
 *   User created successfully!
 * </Alert>
 *
 * @example
 * // Error message for form validation
 * <Alert type="error">
 *   Please fill in all required fields
 * </Alert>
 *
 * @example
 * // Warning message
 * <Alert type="warning" dismissible onDismiss={handleDismiss}>
 *   This action cannot be undone. Are you sure?
 * </Alert>
 */

// CSS classes for different alert types
// Provides consistent color scheme and visual hierarchy
const alertTypes = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800",
};

// CSS classes for alert icons
// Matches the alert type color scheme
const iconColors = {
    info: "text-blue-500",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500",
};

// Icon components for each alert type
const alertIcons = {
    info: InformationCircleIcon,
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    error: ExclamationCircleIcon,
};

function Alert({
                   children,
                   message,
                   type,
                   variant,
                   dismissible = false,
                   onDismiss,
                   className = "",
               }) {
    // Accept `variant` as an alias for `type`, and `message` as a fallback for
    // `children`, so all existing call sites (which use a mix of these) render
    // correctly instead of showing an empty coloured box.
    const kind = type || variant || "info";
    const content = children ?? message;

    // Get the appropriate icon component for the current alert type
    const Icon = alertIcons[kind] || InformationCircleIcon;

    return (
        <div
            className={`border rounded-lg p-4 flex items-start ${alertTypes[kind]} ${className}`}
            role="alert"
            aria-live="polite"
        >
            {/* Alert Icon - Visual indicator for alert type using Heroicons */}
            <div className={`flex-shrink-0 mr-3 ${iconColors[kind]}`}>
                <Icon className="w-5 h-5" aria-hidden="true"/>
            </div>

            {/* Alert Content - Main message text */}
            <div className="flex-1">{content}</div>

            {/* Dismiss Button - Optional close button for user-controlled dismissal */}
            {dismissible && (
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Dismiss alert"
                    title="Dismiss alert"
                >
                    <XMarkIcon className="w-4 h-4"/>
                </button>
            )}
        </div>
    );
}

export default Alert;
