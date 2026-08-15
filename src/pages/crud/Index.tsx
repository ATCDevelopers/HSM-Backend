import React, {useState, useEffect, useCallback} from "react";
import {useNavigate} from "react-router-dom";
import Table from "../../components/sections/Table";
import Action from "../../components/atoms/ui/Action";
import Button from "../../components/atoms/ui/Button";
import Modal from "../../components/atoms/ui/Modal";
import Alert from "../../components/atoms/ui/Alert";
import {extractList, extractMeta} from "../../services/apiResponse";

function Index({
                   resourceName = "Resource",
                   apiService,
                   columns = [],
                   pageSize = 10,
                   enableEdit = true,
                   enableDelete = true,
                   enableRestore = false,
                   enableView = true,
                   getRowActions = null,
                   rowClassName = null,
                   editRoute,
                   showRoute,
                   className = "",
                   onRowClick,
               }) {
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPageSize, setCurrentPageSize] = useState(pageSize);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [showForceDeleteModal, setShowForceDeleteModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const loadData = useCallback(async (page, size) => {
        try {
            setLoading(true);
            setError("");
            const response = await apiService.getAll({page, per_page: size});
            const list = extractList(response);
            const {totalPages, totalItems} = extractMeta(response, list.length);
            setData(list);
            setTotalPages(totalPages);
            setTotalItems(totalItems);
        } catch (err) {
            setError(`Failed to load ${resourceName.toLowerCase()}s: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [apiService, resourceName]);

    const handleRestore = async () => {
        try {
            setLoading(true);
            await apiService.restore(selectedItem.id);
            setSuccess(`${resourceName} restored successfully`);
            setShowRestoreModal(false);
            setSelectedItem(null);
            loadData(currentPage, currentPageSize);
        } catch (err) {
            setError(`Failed to restore ${resourceName.toLowerCase()}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            await apiService.delete(selectedItem.id);
            setSuccess(`${resourceName} deleted successfully`);
            setShowDeleteModal(false);
            setSelectedItem(null);
            loadData(currentPage, currentPageSize);
        } catch (err) {
            setError(`Failed to delete ${resourceName.toLowerCase()}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleForceDelete = async () => {
        try {
            setLoading(true);
            await apiService.forceDelete(selectedItem.id);
            setSuccess(`${resourceName} permanently deleted`);
            setShowForceDeleteModal(false);
            setSelectedItem(null);
            loadData(currentPage, currentPageSize);
        } catch (err) {
            setError(`Failed to permanently delete ${resourceName.toLowerCase()}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (actionType, item) => {
        setSelectedItem(item);
        switch (actionType) {
            case "edit":
                if (editRoute) navigate(`${editRoute}/${item.id}`);
                break;
            case "delete":
                setShowDeleteModal(true);
                break;
            case "forceDelete":
                setShowForceDeleteModal(true);
                break;
            case "restore":
                setShowRestoreModal(true);
                break;
            case "view":
                if (showRoute) navigate(`${showRoute}/${item.id}`);
                break;
            default:
                console.log("Unknown action:", actionType);
        }
    };

    const handlePageSizeChange = (e) => {
        const newSize = Number(e.target.value);
        setCurrentPageSize(newSize);
        setCurrentPage(1);
    };

    const tableColumns = [
        ...columns,
        {
            key: "actions",
            title: "Actions",
            render: (value, row) => {
                const actions = getRowActions
                    ? getRowActions(row)
                    : [
                        ...(enableView ? [{
                            type: "view",
                            label: "View Details",
                            data: row
                        }] : []),
                        ...(enableEdit ? [{
                            type: "edit",
                            label: "Edit",
                            data: row
                        }] : []),
                        ...(enableDelete ? [{
                            type: "delete",
                            label: "Delete",
                            data: row
                        }] : []),
                        ...(enableRestore ? [{
                            type: "restore",
                            label: "Restore",
                            data: row
                        }] : []),
                    ];
                return (
                    <Action
                        variant="dropdown"
                        actions={actions}
                        onAction={handleAction}
                        size="sm"
                    />
                );
            },
        },
    ];

    useEffect(() => {
        loadData(currentPage, currentPageSize);
    }, [currentPage, currentPageSize, loadData]);

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError("");
                setSuccess("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
    const endItem = Math.min(currentPage * currentPageSize, totalItems);

    const pageNumbers = () => {
        const pages = [];
        const delta = 2;
        const left = Math.max(1, currentPage - delta);
        const right = Math.min(totalPages, currentPage + delta);
        for (let i = left; i <= right; i++) pages.push(i);
        return pages;
    };

    return (
        <>
            <div className={`space-y-4 ${className}`}>
                {error && (
                    <Alert
                        type="error"
                        message={error}
                        dismissible
                        onDismiss={() => setError("")}
                    />
                )}
                {/* Success is surfaced globally as a toast (see api interceptor). */}

                <Table
                    columns={tableColumns}
                    data={data}
                    loading={loading}
                    variant="default"
                    size="sm"
                    onRowClick={onRowClick}
                    rowClassName={rowClassName}
                    emptyMessage={`No ${resourceName.toLowerCase()}s found`}
                />

                {/* Pagination Bar */}
                <div className="flex items-center justify-between px-1">
                    {/* Left: count info + page size selector */}
                    <div
                        className="flex items-center gap-4 text-sm text-gray-600">
<span>
{totalItems === 0
    ? "No results"
    : `Showing ${startItem}–${endItem} of ${totalItems}`}
</span>
                        <div className="flex items-center gap-1">
                            <label htmlFor="pageSize"
                                   className="text-gray-500">Rows:</label>
                            <select
                                id="pageSize"
                                value={currentPageSize}
                                onChange={handlePageSizeChange}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {[5, 10, 20, 50].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Right: page navigation */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                            >
                                «
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                ‹
                            </Button>

                            {pageNumbers().map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setCurrentPage(n)}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                        n === currentPage
                                            ? "bg-blue-600 text-white"
                                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}

                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                ›
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                            >
                                »
                            </Button>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title=""
                    size="sm"
                >
                    <div
                        className="flex flex-col items-center text-center space-y-4 pb-2">
                        <div
                            className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-600" fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m2-3h6a1 1 0 011 1v1H8V5a1 1 0 011-1z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Delete {resourceName}</h3>
                            {selectedItem && (
                                <p className="mt-1 text-sm font-medium text-red-600">
                                    {[selectedItem.firstName, selectedItem.middleName, selectedItem.lastName].filter(Boolean).join(" ")
                                        || selectedItem.name || selectedItem.title || `ID: ${selectedItem.id}`}
                                </p>
                            )}
                            <p className="mt-2 text-sm text-gray-500">
                                Are you sure you want to delete
                                this {resourceName.toLowerCase()}?
                                This action can be undone by restoring it later.
                            </p>
                        </div>
                        <div className="flex w-full gap-3 pt-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={loading}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Restore Confirmation Modal */}
                <Modal
                    isOpen={showRestoreModal}
                    onClose={() => setShowRestoreModal(false)}
                    title=""
                    size="sm"
                >
                    <div
                        className="flex flex-col items-center text-center space-y-4 pb-2">
                        <div
                            className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-7 h-7 text-green-600" fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Restore {resourceName}</h3>
                            {selectedItem && (
                                <p className="mt-1 text-sm font-medium text-green-600">
                                    {[selectedItem.firstName, selectedItem.middleName, selectedItem.lastName].filter(Boolean).join(" ")
                                        || selectedItem.name || selectedItem.title || `ID: ${selectedItem.id}`}
                                </p>
                            )}
                            <p className="mt-2 text-sm text-gray-500">
                                Are you sure you want to restore
                                this {resourceName.toLowerCase()}?
                                It will become active again.
                            </p>
                        </div>
                        <div className="flex w-full gap-3 pt-2">
                            <button
                                onClick={() => setShowRestoreModal(false)}
                                disabled={loading}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRestore}
                                disabled={loading}
                                className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Restoring…" : "Restore"}
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Permanent Delete Confirmation Modal */}
                <Modal
                    isOpen={showForceDeleteModal}
                    onClose={() => setShowForceDeleteModal(false)}
                    title=""
                    size="sm"
                >
                    <div
                        className="flex flex-col items-center text-center space-y-4 pb-2">
                        <div
                            className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-600" fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Permanently
                                delete {resourceName}</h3>
                            {selectedItem && (
                                <p className="mt-1 text-sm font-medium text-red-600">
                                    {[selectedItem.firstName, selectedItem.middleName, selectedItem.lastName].filter(Boolean).join(" ")
                                        || selectedItem.name || selectedItem.title || `ID: ${selectedItem.id}`}
                                </p>
                            )}
                            <p className="mt-2 text-sm text-gray-500">
                                This will permanently remove
                                this {resourceName.toLowerCase()}.
                                This action <strong>cannot be undone</strong>.
                            </p>
                        </div>
                        <div className="flex w-full gap-3 pt-2">
                            <button
                                onClick={() => setShowForceDeleteModal(false)}
                                disabled={loading}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleForceDelete}
                                disabled={loading}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Deleting…" : "Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
}

export default Index;
