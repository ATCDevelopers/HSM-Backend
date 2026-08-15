import Header from "./Header";
import Sidebar from "./Sidebar";

/**
 * BaseLayout component that provides the main application layout structure.
 *
 * This component creates a consistent layout across the application with:
 * - Fixed header with resource-specific actions and navigation links
 * - Persistent sidebar navigation
 * - Main content area with proper spacing and overflow handling
 *
 * It serves as the wrapper for all pages, ensuring consistent
 * navigation, responsive design, and proper semantic HTML structure.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The page content to render
 * @param {string} [props.resourceName="Resource"] - The name of the current resource
 * @param {string} [props.headerClassName=""] - Additional CSS classes for header
 * @param {Array} [props.actions=[]] - Array of custom header actions
 * @param {Array} [props.navLinks=[]] - Array of navigation link objects for header
 * @returns {JSX.Element} The rendered BaseLayout component
 */
function BaseLayout({
                        children,
                        resourceName = "Resource",
                        headerClassName = "",
                        actions = [],
                        navLinks = [],
                    }) {
    return (
        <div className="bg-gray-100 min-h-screen flex flex-col">
            {/* Header Section */}
            <Header
                resourceName={resourceName}
                className={headerClassName}
                actions={actions}
                navLinks={navLinks}
            />

            {/* Main Layout Container */}
            <div className="flex flex-1 pt-16">
                {/* Sidebar Navigation */}
                <Sidebar/>

                {/* Content Layout Wrapper */}
                <div className="flex-1 flex ml-64 mt-36 flex-col pr-4">
                    {/* Main Content Area */}
                    <main
                        className="flex-1 overflow-x-hidden overflow-y-auto pr-4"
                        role="main">
                        {/* Page Content Container */}
                        <div
                            className="container mx-auto px-4 max-w-full">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default BaseLayout;
