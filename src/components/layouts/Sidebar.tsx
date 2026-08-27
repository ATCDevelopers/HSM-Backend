import {useEffect, useRef, useState} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {
    HomeIcon,
    UsersIcon,
    UserIcon,
    CalendarIcon,
    DocumentTextIcon,
    BeakerIcon,
    CurrencyDollarIcon,
    ShieldCheckIcon,
    CubeIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/solid";
import {useAuth} from "../../auth/AuthContext";
import {modules, getModulesByRole} from "../../config/modules";

/**
 * Sidebar component that provides persistent navigation for the application.
 *
 * This component renders a fixed-position sidebar containing:
 * - Application branding/logo
 * - Main navigation menu with icon-enhanced links
 * - Current user information section at the bottom
 *
 * The sidebar highlights the active menu item based on the current route,
 * including support for nested/child routes via pathname prefix matching.
 *
 * @returns {JSX.Element} The rendered Sidebar component.
 */
function Sidebar() {
    // Get current location to determine active menu item
    const location = useLocation();
    const navigate = useNavigate();

    // Current authenticated user (null while loading or if signed out).
    const {user, logout} = useAuth();

    // Derive display values defensively — the user may still be loading, and
    // `roles` is only present for the authenticated user (see UserResource).
    const fullName =
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "User";
    const initial = (user?.firstName || user?.username || "U").charAt(0).toUpperCase();
    const role = user?.roles?.[0] || "SYS_ADMIN";

    // Icon mapping for modules
    const iconMap = {
        Home: <HomeIcon className="w-5 h-5"/>,
        Users: <UsersIcon className="w-5 h-5"/>,
        User: <UserIcon className="w-5 h-5"/>,
        Calendar: <CalendarIcon className="w-5 h-5"/>,
        FileText: <DocumentTextIcon className="w-5 h-5"/>,
        Flask: <BeakerIcon className="w-5 h-5"/>,
        Pill: <BeakerIcon className="w-5 h-5"/>,
        DollarSign: <CurrencyDollarIcon className="w-5 h-5"/>,
        Shield: <ShieldCheckIcon className="w-5 h-5"/>,
        Package: <CubeIcon className="w-5 h-5"/>,
        Building: <BuildingOfficeIcon className="w-5 h-5"/>,
        BarChart: <ChartBarIcon className="w-5 h-5"/>,
        Settings: <Cog6ToothIcon className="w-5 h-5"/>,
    };

    /**
     * Sign the user out, then send them to the login screen. The provider
     * clears the token/user even if the network call fails.
     */
    const handleLogout = async () => {
        await logout();
        navigate("/login", {replace: true});
    };

    /**
     * Get accessible modules based on user role
     * In development mode, all modules are accessible
     */
    const accessibleModules = role ? getModulesByRole(role) : modules;

    /**
     * Convert modules to menu items with icons
     */
    const menuItems = accessibleModules.map((module) => ({
        path: module.path,
        label: module.name,
        icon: iconMap[module.icon] || <HomeIcon className="w-5 h-5"/>,
        exact: module.path === "/",
        children: module.children || [],
    }));

    /**
     * Determines if a menu item should be highlighted as active.
     *
     * Uses prefix matching to support nested routes (e.g., /tasks/123 will activate the /tasks item).
     *
     * @param {string} menuPath - The path defined for the menu item.
     * @returns {boolean} True if the current pathname starts with the menu path.
     */
    const isActive = (item) => {
        const menuPath = typeof item === "string" ? item : item.path;
        const exact = typeof item === "object" && item.exact;
        return exact ? location.pathname === menuPath : location.pathname.startsWith(menuPath);
    };

    const [expandedModules, setExpandedModules] = useState({
        "/appointments": true,
    });

    const toggleModule = (path) => {
        setExpandedModules((prev) => ({
            ...prev,
            [path]: !(prev[path] ?? true),
        }));
    };

    const renderMenuItem = (item, depth = 0) => {
        const isSubItem = depth > 0;
        const hasChildren = item.children && item.children.length > 0;
        const active = isActive(item);
        const expanded = expandedModules[item.path] ?? (item.path === "/appointments");

        return (
            <li key={item.path} ref={active ? activeRef : null}>
                <div
                    className={`
                        flex items-center rounded-l-lg transition-all duration-200
                        ${
                            active
                                ? "bg-green-600 text-white shadow-lg"
                                : "hover:bg-gray-800 text-gray-300 hover:text-white"
                        }
                        ${isSubItem ? "ml-4 mt-1 p-2 text-sm" : "p-3"}
                    `}
                >
                    <Link to={item.path} className="flex flex-1 items-center min-w-0">
                        <span className={isSubItem ? "text-base" : "text-xl"}>{item.icon}</span>
                        <span className="ml-3 font-medium truncate">{item.label}</span>
                    </Link>

                    {hasChildren && (
                        <button
                            type="button"
                            aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                            onClick={(event) => {
                                event.preventDefault();
                                toggleModule(item.path);
                            }}
                            className="ml-2 rounded p-1 text-gray-200 hover:bg-white/10"
                        >
                            <ChevronDownIcon
                                className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                            />
                        </button>
                    )}
                </div>

                {hasChildren && expanded && (
                    <ul className="mt-1 space-y-1 overflow-hidden">
                        {item.children.map((child) => {
                            const childItem = {
                                ...child,
                                icon: iconMap[child.icon] || <CalendarIcon className="w-4 h-4"/>,
                                exact: false,
                            };
                            return renderMenuItem(childItem, depth + 1);
                        })}
                    </ul>
                )}
            </li>
        );
    };

    // Scroll the active item into view when navigating, so it is visible even
    // when it sits below the fold of the scrollable nav.
    const activeRef = useRef(null);
    useEffect(() => {
        activeRef.current?.scrollIntoView({block: "nearest"});
    }, [location.pathname]);

    return (
        <>
            <aside
                className="fixed left-0 top-0 h-full w-64 bg-gray-900 shadow-2xl z-40 flex flex-col">
                {/* Logo/Brand Section */}
                <div
                    className="p-4 ps-10 border-b border-gray-800 h-35 relative z-20 bg-gray-900">
                    <h1 className="text-3xl font-bold text-white">React
                        Application</h1>
                </div>

                {/* Navigation Menu */}
                <nav className="ps-4 flex-1 mt-5 overflow-y-auto relative z-10">
                    <ul className="space-y-2 pt-10 pb-28">
                        {menuItems.map((item) => renderMenuItem(item, 0))}
                    </ul>
                </nav>

                {/* User Information Section */}
                <div
                    className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800 relative z-20 rounded-t-2xl">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div
                                className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-green-500/20">
                                <span
                                    className="text-white font-bold text-sm">{initial}</span>
                            </div>
                            <div
                                className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{fullName}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
								<span
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600/20 text-green-400 border border-green-600/30 capitalize">
									{role}
								</span>
                            </div>
                        </div>
                    </div>

                    {/* Sign out — clearly labelled exit action */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        aria-label="Sign out"
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/50 transition-colors cursor-pointer"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5"/>
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
