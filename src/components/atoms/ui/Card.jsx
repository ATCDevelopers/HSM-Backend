/**
 * Card Component - A versatile container component for grouping related content
 *
 * This component provides a consistent card layout throughout the application
 * with customizable padding, shadows, and styling. Perfect for creating
 * visually distinct sections of content.
 *
 * Common use cases:
 * - Dashboard widgets and statistics
 * - Form containers and input groups
 * - Content sections and article previews
 * - Product cards and item displays
 * - Settings panels and configuration areas
 *
 * @param {React.ReactNode} children - Content to display inside the card
 * @param {string} className - Additional CSS classes for custom styling
 * @param {string} padding - Padding class: "p-4", "p-6", "p-8", or custom padding
 * @param {string} shadow - Shadow class: "shadow-sm", "shadow-md", "shadow-lg", "shadow-xl", or "none"
 *
 * @example
 * // Default card
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </Card>
 *
 * @example
 * // Card with custom padding and shadow
 * <Card padding="p-8" shadow="shadow-lg">
 *   <h2>Statistics</h2>
 *   <div className="grid grid-cols-2 gap-4">
 *     <div>Stat 1</div>
 *     <div>Stat 2</div>
 *   </div>
 * </Card>
 *
 * @example
 * // Compact card for tight spaces
 * <Card padding="p-4" shadow="shadow-sm">
 *   <h4>Quick Info</h4>
 *   <p>Brief content here</p>
 * </Card>
 */
function Card({
                  children,
                  className = "",
                  padding = "p-6",
                  shadow = "shadow-md"
              }) {
    // Base styling that applies to all cards
    const baseClasses = "bg-white rounded-lg border border-gray-200";

    // Combine all classes, filtering out any falsy values
    const cardClasses = [baseClasses, shadow, padding, className].filter(Boolean).join(" ");

    return <div className={cardClasses}>{children}</div>;
}

export default Card;
