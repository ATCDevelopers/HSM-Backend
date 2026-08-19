import {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import Alert from "../../components/atoms/ui/Alert";
import {resourceSchemas} from "../../config/resourceSchemas";

/**
 * CRUD Show Component - A generic component for displaying single resource details
 *
 * This component fetches and displays detailed information about a single resource
 * with options to navigate back or edit the resource.
 *
 * @param {string} resource - Resource key to look up in resourceSchemas
 * @param {string} resourceName - The name of the resource (e.g., "User", "Task")
 * @param {Object} apiService - API service object with getById method
 * @param {Array} columns - Array of column definitions for displaying fields
 * @param {string} editRoute - Route path for editing the resource (will append item ID)
 * @param {string} backRoute - Route path for navigating back to list
 * @param {boolean} enableEdit - Whether to show edit button
 * @param {string} className - Additional CSS classes
 * @param {...any} props - Additional props to spread on container div
 */
function Show({
                  resource,
                  resourceName,
                  apiService,
                  columns,
                  className = "",
                  ...props
              }) {
    const {id} = useParams(); // Get resource ID from URL

    // Derive props from resource schema if resource prop is provided
    let derivedResourceName = resourceName || "Resource";
    let derivedApiService = apiService;
    let derivedColumns = columns || [];

    if (resource && resourceSchemas[resource]) {
        const schema = resourceSchemas[resource];
        derivedResourceName = schema.name;
        derivedApiService = schema.api;
        derivedColumns = schema.fields.map(field => ({
            key: field.key,
            title: field.label,
        }));
    }

    // Component state
    const [data, setData] = useState(null); // Single resource data
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(""); // Error message

    // Fetch resource data on component mount
    useEffect(() => {
        const loadResource = async () => {
            try {
                setLoading(true);
                const response = await derivedApiService.getById(id);
                const raw = response.data;
                const user = Array.isArray(raw) ? raw[0] : (raw?.data || raw);
                setData(user);
            } catch (err) {
                setError(`Failed to load ${derivedResourceName.toLowerCase()}: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadResource();
        }
    }, [id, derivedApiService, derivedResourceName]);

    // Loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Alert variant="error" className="m-4">
                {error}
            </Alert>
        );
    }

    // No data found
    if (!data) {
        return (
            <Alert variant="warning" className="m-4">
                {derivedResourceName} not found.
            </Alert>
        );
    }

    return (
        <div className={`space-y-6 ${className}`} {...props}>
            {/* Resource details */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        {derivedColumns.map((column) => (
                            <div key={column.key} className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">
                                    {column.title}
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {column.render
                                        ? column.render(data[column.key], data)
                                        : data[column.key] || "—"}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
}

export default Show;
