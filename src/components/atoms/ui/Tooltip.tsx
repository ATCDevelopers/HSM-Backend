import {useState} from "react";

/**
 * Tooltip Component - A versatile tooltip component for displaying contextual information
 *
 * This component provides hover-triggered tooltips with customizable positioning
 * and directional arrows. Perfect for providing additional context or help text
 * without cluttering the main interface.
 *
 * Common use cases:
 * - Form field help text and explanations
 * - Button action descriptions
 * - Icon meaning clarifications
 * - Data value explanations
 * - Keyboard shortcut hints
 * - Status indicator descriptions
 *
 * @param {React.ReactNode} children - The element that triggers the tooltip
 * @param {string} text - The tooltip text content to display
 * @param {string} position - Tooltip position: "top", "bottom", "left", "right"
 * @param {string} className - Additional CSS classes for the tooltip container
 *
 * @example
 * // Basic tooltip
 * <Tooltip text="Click to save your changes">
 *   <Button>Save</Button>
 * </Tooltip>
 *
 * @example
 * // Tooltip with custom positioning
 * <Tooltip text="Delete this item permanently" position="left">
 *   <TrashIcon className="w-5 h-5" />
 * </Tooltip>
 *
 * @example
 * // Form field help
 * <Tooltip text="Enter a strong password with at least 8 characters">
 *   <label>Password</label>
 * </Tooltip>
 *
 * @example
 * // Icon tooltip
 * <Tooltip text="Export data to CSV format">
 *   <Button variant="outline" size="sm">
 *     <ArrowDownTrayIcon className="w-4 h-4" />
 *   </Button>
 * </Tooltip>
 */
function Tooltip({children, text, position = "top", className = ""}) {
    // State to control tooltip visibility
    // Tooltip appears on hover and disappears when mouse leaves
    const [isVisible, setIsVisible] = useState(false);

    // Position classes for tooltip placement relative to the trigger element
    // Each position uses absolute positioning with transforms for perfect centering
    const positions = {
        top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
        left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
        right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
    };

    // Arrow styles that point from tooltip to the trigger element
    // Uses CSS borders to create triangular arrows with transparent sides
    const arrows = {
        top: "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-gray-900",
        bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-900",
        left: "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-gray-900",
        right: "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-gray-900",
    };

    return (
        // Container for both trigger element and tooltip
        // Relative positioning allows absolute positioning of tooltip
        <div
            className={`relative inline-block ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {/* The element that triggers the tooltip on hover */}
            {children}

            {/* Tooltip content - Only rendered when visible */}
            {isVisible && (
                <div
                    className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap ${positions[position]}`}
                    role="tooltip"
                >
                    {/* Tooltip text content */}
                    {text}

                    {/* Directional arrow pointing to trigger element */}
                    <div
                        className={`absolute w-0 h-0 border-4 ${arrows[position]}`}></div>
                </div>
            )}
        </div>
    );
}

export default Tooltip;
