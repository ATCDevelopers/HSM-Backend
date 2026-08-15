import Button from "../atoms/ui/Button";
import Breadcrumb from "../atoms/ui/Breadcrumb";

/**
 * Header component that provides the main application header with navigation and actions.
 *
 * This component renders a fixed header containing resource information, breadcrumb navigation,
 * navigation links, and custom action buttons in a two-row layout.
 *
 * @param {Object} props - Component props
 * @param {string} [props.resourceName="Resource"] - The name of the current resource
 * @param {Array} [props.actions=[]] - Array of custom action objects
 * @param {Object[]} props.actions - Array of action button objects with the following structure:
 *   @param {string} actions[].key - Unique identifier for the action
 *   @param {string} actions[].label - Text displayed on the button
 *   @param {Function} actions[].onClick - Function to execute when clicked
 *   @param {React.Component} [actions[].icon] - Optional Heroicon component
 *   @param {string} [actions[].variant="primary"] - Button variant ("primary", "secondary", "outline", etc.)
 * @param {Array} [props.navLinks=[]] - Array of navigation link objects
 * @param {Object[]} props.navLinks - Array of navigation link objects with the following structure:
 *   @param {string} navLinks[].key - Unique identifier for the link
 *   @param {string} navLinks[].label - Text displayed for the link
 *   @param {Function} navLinks[].onClick - Function to execute when clicked
 *   @param {React.Component} [navLinks[].icon] - Optional Heroicon component
 *   @param {boolean} [navLinks[].active=false] - Whether the link is currently active
 * @param {string} [props.className=""] - Additional CSS classes
 * @returns {JSX.Element} The rendered Header component
 *
 * @example
 * // Example usage with navLinks and actions
 * <Header
 *   resourceName="Project"
 *   navLinks={[
 *     {
 *       key: "list",
 *       label: "List View",
 *       icon: ListIcon,
 *       active: true,
 *       onClick: () => console.log("List view")
 *     },
 *     {
 *       key: "grid",
 *       label: "Grid View",
 *       icon: GridIcon,
 *       active: false,
 *       onClick: () => console.log("Grid view")
 *     }
 *   ]}
 *   actions={[
 *     {
 *       key: "create",
 *       label: "Add Project",
 *       icon: PlusIcon,
 *       onClick: () => navigate("/projects/create"),
 *       variant: "primary"
 *     },
 *     {
 *       key: "export",
 *       label: "Export",
 *       icon: DocumentArrowDownIcon,
 *       onClick: handleExport,
 *       variant: "secondary"
 *     }
 *   ]}
 * />
 */
function Header({
                    resourceName = "Resource",
                    actions = [],
                    navLinks = [],
                    className = ""
                }) {
    /**
     * Determines if resource-specific header should be shown.
     * Hides header when resourceName is the default "Resource" placeholder.
     */
    const showResourceHeader = resourceName !== "Resource";

    return (
        <div
            className={`
				fixed top-0 left-64 right-0 z-50 
				bg-gray-900 shadow-2xl
				${className}
			`}
        >
            {/* Top Row: Title and Breadcrumb */}
            <div className="px-6 py-3 border-b border-gray-800">
                <div className="flex items-center justify-between">
                    {/* Title Section */}
                    <div>
                        {showResourceHeader ? (
                            <>
                                <h1 className="text-3xl font-bold text-white">{resourceName}</h1>
                                <p className="text-sm text-gray-400">
                                    Manage all {resourceName.toLowerCase()} in
                                    the system
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold text-white">React
                                    Application</h1>
                                <p className="text-sm text-gray-400">
                                    Generic Starter Template
                                </p>
                            </>
                        )}
                    </div>

                    {/* Breadcrumb */}
                    <div className="flex-1 flex justify-end">
                        <Breadcrumb/>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Navigation Links and Actions */}
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Navigation Links */}
                    <div className="flex items-center space-x-6">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <button
                                    key={link.key}
                                    onClick={link.onClick}
                                    className={`
										flex items-center p-3 rounded-lg transition-all duration-200
										${
                                        link.active
                                            ? "bg-blue-600 text-white shadow-lg"
                                            : "hover:bg-gray-800 text-gray-300 hover:text-white"
                                    }
									`}
                                >
									<span className="text-xl">
										{Icon && <Icon className="w-5 h-5"/>}
									</span>
                                    <span
                                        className="ml-3 font-medium">{link.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                        {actions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Button
                                    key={action.key}
                                    variant={action.variant || "primary"}
                                    onClick={action.onClick}
                                    className="flex items-center space-x-2"
                                >
                                    {Icon && <Icon className="w-4 h-4"/>}
                                    <span>{action.label}</span>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Header;
