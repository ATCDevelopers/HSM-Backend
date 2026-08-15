import React from "react";
import {Link, useLocation} from "react-router-dom";
import {ChevronRightIcon} from "@heroicons/react/24/outline";

/**
 * Breadcrumb Component - Navigation breadcrumb component for showing page hierarchy
 *
 * This component automatically generates breadcrumbs from the current URL path,
 * providing users with clear navigation context and easy back-navigation options.
 *
 * Common use cases:
 * - Page headers showing navigation hierarchy
 * - Admin panels with deep navigation structures
 * - E-commerce product category navigation
 * - Documentation site section indicators
 *
 * @param {string} homeLabel - Label for the home breadcrumb item (default: "Home")
 * @param {string} homePath - Path for the home breadcrumb item (default: "/")
 *
 * @example
 * // Default usage
 * <Breadcrumb />
 *
 * @example
 * // Custom home label
 * <Breadcrumb homeLabel="Dashboard" homePath="/dashboard" />
 *
 * @example
 * // In a page header
 * <div className="page-header">
 *   <Breadcrumb />
 *   <h1>Current Page</h1>
 * </div>
 */
function Breadcrumb({homeLabel = "Home", homePath = "/"}) {
    const location = useLocation();

    // Don't show breadcrumbs on the home page
    // This prevents redundant navigation when user is already at the root
    if (location.pathname === "/") {
        return null;
    }

    // Split the current path into segments and filter out empty strings
    // Example: "/users/edit/123" -> ["users", "edit", "123"]
    const pathnames = location.pathname.split("/").filter((x) => x);

    // Build breadcrumb array with home item and path segments
    // Each item has a label (display text) and path (navigation target)
    const breadcrumbs = [
        {label: homeLabel, path: homePath},
        ...pathnames.map((name, index) => {
            // Build the cumulative path for each breadcrumb level
            // Example: index 1 -> "/users", index 2 -> "/users/edit"
            const path = `/${pathnames.slice(0, index + 1).join("/")}`;

            // Format the label: capitalize first letter, keep rest as-is
            // Example: "users" -> "Users", "edit" -> "Edit"
            const label = name.charAt(0).toUpperCase() + name.slice(1);

            return {label, path};
        }),
    ];

    return (
        <nav
            className="flex items-center space-x-1 text-sm text-gray-300 py-3 px-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-lg"
            aria-label="Breadcrumb navigation"
        >
            {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                    <React.Fragment key={item.path}>
                        {index === 0 ? (
                            // Home breadcrumb - always a link (unless it's the last item)
                            <Link
                                to={item.path}
                                className="text-gray-100 hover:text-white transition-all duration-200 hover:bg-gray-700 px-3 py-1 rounded-md border border-transparent hover:border-gray-600"
                                aria-current={isLast ? "page" : undefined}
                            >
                                {item.label}
                            </Link>
                        ) : (
                            // Subsequent breadcrumbs with separator
                            <>
                                {/* Separator icon between breadcrumb items */}
                                <ChevronRightIcon
                                    className="w-4 h-4 text-gray-100 mx-1"
                                    aria-hidden="true"
                                />

                                {isLast ? (
                                    // Current page - not clickable, shows active state
                                    <span
                                        className="text-white font-medium bg-green-600 px-3 py-1 rounded-md border border-green-500 shadow-md"
                                        aria-current="page"
                                    >
										{item.label}
									</span>
                                ) : (
                                    // Navigable breadcrumb item
                                    <Link
                                        to={item.path}
                                        className="text-gray-400 hover:text-white transition-all duration-200 hover:bg-gray-700 px-3 py-1 rounded-md border border-transparent hover:border-gray-600"
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}

export default Breadcrumb;
