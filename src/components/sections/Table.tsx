import {
    ChevronUpIcon,
    ChevronDownIcon,
    InboxIcon
} from "@heroicons/react/24/outline";

/**
 * Table Component - A reusable data table with sorting, variants, and loading states
 *
 * @param {Array} columns - Array of column definitions with key, title, render function, etc.
 * @param {Array} data - Array of data objects to display in rows
 * @param {Function} onRowClick - Optional callback when a row is clicked (row, index) => {}
 * @param {Function} onSort - Optional callback for column sorting (columnKey, direction) => {}
 * @param {string} sortColumn - Current sort column key
 * @param {string} sortDirection - Current sort direction ("asc" or "desc")
 * @param {string} className - Additional CSS classes
 * @param {string} variant - Table style: "default", "dark"
 * @param {string} size - Table cell size: "sm", "md", "lg"
 * @param {string} emptyMessage - Message to show when no data
 * @param {boolean} loading - Show loading spinner when true
 */

// Shared card wrapper component for consistent styling
function TableCard({children, container, className, ...props}) {
    return (
        <div
            className={`w-full overflow-hidden rounded-xl ${container} ${className}`} {...props}>
            {children}
        </div>
    );
}

function Table({
                   columns = [],
                   data = [],
                   onRowClick,
                   onSort,
                   sortColumn,
                   sortDirection,
                   className = "",
                   variant = "default",
                   size = "md", // sm, md, lg
                   emptyMessage = "No data available",
                   loading = false,
                   rowClassName = null,
                   ...props
               }) {
    // Cell padding / font size per density
    const sizeClasses = {
        sm: "text-sm px-4 py-2.5",
        md: "text-sm px-6 py-3.5",
        lg: "text-base px-6 py-4",
    };

    // Header padding per density
    const headerSizeClasses = {
        sm: "px-4 py-2.5",
        md: "px-6 py-3",
        lg: "px-6 py-3.5",
    };

    // Theme tokens per variant
    const theme = {
        default: {
            container: "border border-gray-200 bg-white shadow-sm",
            header: "bg-gray-50/80 text-gray-500 border-b border-gray-200",
            body: "divide-y divide-gray-100",
            row: "hover:bg-blue-50/70 hover:shadow-[inset_3px_0_0_0_theme(colors.blue.500)]",
            cell: "text-gray-700",
        },
        dark: {
            container: "border border-gray-700 bg-gray-900 shadow-sm",
            header: "bg-gray-800 text-gray-400 border-b border-gray-700",
            body: "divide-y divide-gray-800",
            row: "hover:bg-gray-800 hover:shadow-[inset_3px_0_0_0_theme(colors.blue.400)]",
            cell: "text-gray-200",
        },
    }[variant] || {};

    /**
     * Handle column sorting
     */
    const handleSort = (column) => {
        if (onSort && column.sortable) {
            const newDirection =
                sortColumn === column.key && sortDirection === "asc" ? "desc" : "asc";
            onSort(column.key, newDirection);
        }
    };

    /**
     * Render sort icon (up/down arrow) for sortable columns
     */
    const renderSortIcon = (column) => {
        if (!column.sortable || !onSort) return null;
        const isActive = sortColumn === column.key;
        const Icon = isActive && sortDirection === "desc" ? ChevronDownIcon : ChevronUpIcon;
        return (
            <Icon
                className={`w-3.5 h-3.5 ml-1 transition-colors ${isActive ? "text-blue-600" : "text-gray-300 group-hover:text-gray-400"}`}
            />
        );
    };

    // Loading state
    if (loading) {
        return (
            <TableCard container={theme.container}
                       className={className} {...props}>
                <div
                    className="flex flex-col items-center justify-center gap-3 py-16">
                    <div
                        className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600"/>
                    <p className="text-sm text-gray-400">Loading…</p>
                </div>
            </TableCard>
        );
    }

    // Empty state
    if (!data || data.length === 0) {
        return (
            <TableCard container={theme.container}
                       className={className} {...props}>
                <div
                    className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <div
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <InboxIcon className="h-6 w-6 text-gray-400"/>
                    </div>
                    <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
                </div>
            </TableCard>
        );
    }

    // Inject a serial-number column as the first column
    const tableColumns = [
        {
            key: "sn",
            title: "#",
            sortable: false,
            className: "w-12",
            render: (value, row, index) => (
                <span className="tabular-nums text-gray-400">{index + 1}</span>
            ),
        },
        ...columns,
    ];

    return (
        <TableCard container={theme.container} className={className} {...props}>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    {/* Header */}
                    <thead className={theme.header}>
                    <tr>
                        {tableColumns.map((column) => {
                            const sortable = column.sortable && onSort;
                            return (
                                <th
                                    key={column.key}
                                    scope="col"
                                    aria-sort={
                                        sortColumn === column.key
                                            ? sortDirection === "asc"
                                                ? "ascending"
                                                : "descending"
                                            : undefined
                                    }
                                    className={`
											${headerSizeClasses[size]}
											text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap select-none
											${sortable ? "group cursor-pointer hover:text-gray-700" : ""}
											${column.className || ""}
										`}
                                    onClick={() => handleSort(column)}
                                >
                                    <div className="flex items-center">
                                        {column.title}
                                        {renderSortIcon(column)}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                    </thead>

                    {/* Body */}
                    <tbody className={theme.body}>
                    {data.map((row, index) => (
                        <tr
                            key={row.id || index}
                            className={`
									${theme.row}
									transition-colors
									${onRowClick ? "cursor-pointer" : ""}
									${rowClassName ? rowClassName(row, index) : ""}
								`}
                            onClick={() => onRowClick && onRowClick(row, index)}
                        >
                            {tableColumns.map((column) => (
                                <td
                                    key={column.key}
                                    className={`
											${sizeClasses[size]}
											${theme.cell}
											align-middle
											${column.className || ""}
										`}
                                >
                                    {column.render
                                        ? column.render(row[column.key], row, index)
                                        : row[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </TableCard>
    );
}

export default Table;
