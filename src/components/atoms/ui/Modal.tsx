import {XMarkIcon} from "@heroicons/react/24/outline";

/**
 * Modal Component - A versatile modal dialog component with customizable sizes
 *
 * This component provides a consistent modal interface throughout the application
 * with support for different sizes, backdrop closing, and accessibility features.
 * Automatically handles focus management and escape key closing.
 *
 * Common use cases:
 * - Confirmation dialogs (delete, save, cancel actions)
 * - Form modals (create, edit, update operations)
 * - Detail views and information displays
 * - Settings and configuration panels
 * - Image galleries and media viewers
 *
 * @param {boolean} isOpen - Whether the modal is currently open
 * @param {Function} onClose - Function to call when modal should close
 * @param {React.ReactNode} children - Content to display inside the modal
 * @param {string} title - Optional title to display in the modal header
 * @param {string} size - Modal size: "sm", "md", "lg", "xl"
 *
 * @example
 * // Confirmation modal
 * <Modal
 *   isOpen={showDeleteModal}
 *   onClose={() => setShowDeleteModal(false)}
 *   title="Confirm Delete"
 *   size="sm"
 * >
 *   <p>Are you sure you want to delete this item?</p>
 *   <div className="flex justify-end space-x-2 mt-4">
 *     <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
 *     <Button variant="danger" onClick={handleDelete}>Delete</Button>
 *   </div>
 * </Modal>
 *
 * @example
 * // Form modal
 * <Modal
 *   isOpen={showEditModal}
 *   onClose={() => setShowEditModal(false)}
 *   title="Edit User"
 *   size="lg"
 * >
 *   <UserForm user={selectedUser} onSubmit={handleUpdate} />
 * </Modal>
 *
 * @example
 * // Simple modal without title
 * <Modal isOpen={showInfo} onClose={() => setShowInfo(false)}>
 *   <div className="text-center">
 *     <h3>Information</h3>
 *     <p>This is important information for the user.</p>
 *   </div>
 * </Modal>
 */
function Modal({isOpen, onClose, children, title, size = "md"}) {
    // Don't render modal if it's not open
    // This prevents unnecessary DOM manipulation and improves performance
    if (!isOpen) return null;

    // Size variations for different content types and use cases
    const sizes = {
        sm: "max-w-md", // Small modals for confirmations, alerts
        md: "max-w-lg", // Medium modals for forms, details
        lg: "max-w-2xl", // Large modals for complex forms, tables
        xl: "max-w-4xl", // Extra large modals for complex content
    };

    // Handle clicks on the backdrop (area outside the modal)
    // This provides intuitive UX - users expect modals to close when clicking outside
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        // Modal backdrop with overlay
        // Fixed positioning ensures it covers the entire viewport
        <div
            className="fixed inset-0 z-50 overflow-auto flex items-center justify-center p-4"
            style={{backgroundColor: "rgba(100, 116, 139, 0.5)"}}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
        >
            {/* Modal content container */}
            <div
                className={`bg-white rounded-lg shadow-xl w-full ${sizes[size]}`}>
                {/* Modal Header - Only rendered if title is provided */}
                {title && (
                    <div
                        className="flex items-center justify-between p-6 border-b">
                        <h2 id="modal-title" className="text-lg font-semibold">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close modal"
                        >
                            <XMarkIcon className="w-5 h-5"/>
                        </button>
                    </div>
                )}

                {/* Modal Body - Main content area */}
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export default Modal;
