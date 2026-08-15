/**
 * Badge Component - A versatile badge component for status indicators and labels
 *
 * This component provides a consistent way to display small pieces of information
 * like status indicators, counts, or categorical labels throughout the application.
 *
 * Common use cases:
 * - Status indicators (active, pending, inactive)
 * - Notification counts and badges
 * - Category tags and labels
 * - User role or permission indicators
 * - Feature availability indicators
 * - User presence states (online, offline, busy, away)
 *
 * @param {React.ReactNode} children - The content to display inside the badge
 * @param {string} variant - Badge style variant: "default", "success", "warning", "danger", "info", "primary", "status"
 * @param {string} size - Badge size: "sm", "md", "lg"
 * @param {string} status - Specific status for status variant: "online", "offline", "busy", "away", "active", "inactive", "pending", "completed", "success", "error", "warning"
 * @param {boolean} showDot - Whether to show colored dot indicator (only for status variant)
 * @param {string} className - Additional CSS classes for styling
 *
 * @example
 * // Standard badge
 * <Badge variant="success">Active</Badge>
 *
 * @example
 * // Status badge with dot indicator
 * <Badge variant="status" status="online" showDot={true}>Online</Badge>
 *
 * @example
 * // Status badge without dot (like original Status component)
 * <Badge variant="status" status="active">Active</Badge>
 *
 * @example
 * // Notification count
 * <Badge variant="danger" size="sm">3</Badge>
 *
 * @example
 * // Category tag
 * <Badge variant="info">New Feature</Badge>
 */
function Badge({
                   children,
                   variant = "default",
                   size = "md",
                   status = "active",
                   showDot = false,
                   className = "",
               }) {
    // Base classes that apply to all badges
    const baseClasses = "inline-flex items-center font-medium rounded-full";

    // Variant styles for different semantic meanings
    const variants = {
        default: "bg-gray-100 text-gray-800",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        danger: "bg-red-100 text-red-800",
        info: "bg-blue-100 text-blue-800",
        primary: "bg-blue-500 text-white",
        status: "bg-transparent text-gray-600",
    };

    // Status configurations from the original Status component
    const statusConfig = {
        online: {color: "bg-green-500", label: "Online"},
        offline: {color: "bg-gray-400", label: "Offline"},
        busy: {color: "bg-red-500", label: "Busy"},
        away: {color: "bg-yellow-500", label: "Away"},
        active: {color: "bg-green-500", label: "Active"},
        inactive: {color: "bg-gray-400", label: "Inactive"},
        pending: {color: "bg-yellow-500", label: "Pending"},
        completed: {color: "bg-blue-500", label: "Completed"},
        success: {color: "bg-green-500", label: "Success"},
        error: {color: "bg-red-500", label: "Error"},
        warning: {color: "bg-yellow-500", label: "Warning"},
    };

    // Size variations for different use cases and contexts
    const sizes = {
        sm: "px-2 py-1 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-4 py-2 text-base",
    };

    // Get the current status configuration
    const currentStatus = statusConfig[status] || statusConfig.active;

    // Combine all classes, filtering out any falsy values
    const badgeClasses = [
        baseClasses,
        variants[variant] || variants.default,
        sizes[size] || sizes.md,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    // For status variant with dot indicator, render dot + text
    if (variant === "status" && showDot) {
        return (
            <div className={`flex items-center space-x-2 ${badgeClasses}`}>
                <div
                    className={`w-2 h-2 rounded-full ${currentStatus.color}`}></div>
                <span>{children || currentStatus.label}</span>
            </div>
        );
    }

    // For status variant without dot, render just text with appropriate color
    if (variant === "status") {
        return (
            <div className={`flex items-center space-x-2 ${badgeClasses}`}>
                {children || currentStatus.label}
            </div>
        );
    }

    // Standard badge rendering
    return <span className={badgeClasses}>{children}</span>;
}

export default Badge;
