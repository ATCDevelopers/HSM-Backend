import {useState, useRef} from "react";
import {CloudArrowUpIcon, XMarkIcon} from "@heroicons/react/24/outline";

/**
 * FileUpload Component - A comprehensive file upload component with drag & drop support
 *
 * This component provides a full-featured file upload interface with drag-and-drop functionality,
 * file validation, size limits, and visual feedback. Perfect for document uploads,
 * image galleries, and any file selection requirements.
 *
 * Common use cases:
 * - Document uploads (PDFs, Word docs, spreadsheets)
 * - Image uploads for profiles, galleries, or content
 * - File attachments in forms and messages
 * - Bulk file uploads and batch processing
 * - Media file uploads for content management
 *
 * @param {string} label - Label text displayed above the file upload area
 * @param {string} accept - File types to accept (e.g., "image/*", ".pdf,.doc")
 * @param {boolean} multiple - Whether to allow multiple file selection
 * @param {number} maxSize - Maximum file size in bytes (default: 5MB)
 * @param {boolean} disabled - Whether the file upload is disabled
 * @param {boolean} required - Whether file upload is required for form validation
 * @param {string} error - Error message to display (shows red border and error text)
 * @param {string} className - Additional CSS classes for styling
 * @param {Function} onFileSelect - Callback when files are selected: (files) => {}
 * @param {...any} props - Additional input attributes to spread
 *
 * @example
 * // Single file upload
 * <FileUpload
 *   label="Profile Picture"
 *   accept="image/*"
 *   maxSize={2 * 1024 * 1024} // 2MB
 *   onFileSelect={handleProfilePicture}
 *   required
 * />
 *
 * @example
 * // Multiple file upload
 * <FileUpload
 *   label="Documents"
 *   accept=".pdf,.doc,.docx"
 *   multiple
 *   maxSize={10 * 1024 * 1024} // 10MB
 *   onFileSelect={handleDocuments}
 * />
 *
 * @example
 * // Image gallery upload
 * <FileUpload
 *   label="Gallery Images"
 *   accept="image/*"
 *   multiple
 *   onFileSelect={handleGalleryImages}
 *   error={errors.images}
 * />
 *
 * @example
 * // Disabled file upload
 * <FileUpload
 *   label="Archived Files"
 *   disabled
 *   accept="*\*"
 * />
 */
function FileUpload({
                        label,
                        accept = "*/*",
                        multiple = false,
                        maxSize = 5 * 1024 * 1024, // 5MB default
                        disabled = false,
                        required = false,
                        error = "",
                        className = "",
                        onFileSelect,
                        ...props
                    }) {
    // State for drag and drop interaction
    const [dragActive, setDragActive] = useState(false);

    // State for selected files
    const [files, setFiles] = useState([]);

    // State for upload-specific errors
    const [uploadError, setUploadError] = useState("");

    // Reference to hidden file input
    const fileInputRef = useRef(null);

    // Handle file selection from the file input dialog
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        console.log("Files selected:", selectedFiles);
        handleFiles(selectedFiles);
    };

    // Handle drag over event for visual feedback
    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    // Handle drag leave event
    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragActive(false);
    };

    // Handle file drop event
    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        console.log("Files dropped:", droppedFiles);
        handleFiles(droppedFiles);
    };

    // Process and validate selected files
    const handleFiles = (newFiles) => {
        // Validate file sizes and filter out oversized files
        const validFiles = newFiles.filter((file) => {
            if (maxSize && file.size > maxSize) {
                setUploadError(
                    `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`,
                );
                return false;
            }
            return true;
        });

        // If any files were rejected, stop processing
        if (validFiles.length !== newFiles.length) {
            return;
        }

        // Clear any previous errors
        setUploadError("");
        console.log("Setting files:", validFiles);

        // Update files state
        setFiles((prev) => {
            const newFiles = [...prev, ...validFiles];
            console.log("Updated files state:", newFiles);
            return newFiles;
        });

        // Call parent callback with selected files
        if (onFileSelect) {
            onFileSelect(multiple ? validFiles : validFiles[0]);
        }
    };

    // Remove a file from the selected files list
    const removeFile = (index) => {
        console.log("Removing file at index:", index);
        setFiles((prev) => {
            const newFiles = prev.filter((_, i) => i !== index);
            console.log("Files after removal:", newFiles);
            return newFiles;
        });
    };

    // Open the file selection dialog
    const openFileDialog = () => {
        console.log("Opening file dialog");
        fileInputRef.current?.click();
    };

    // Format file size for display (Bytes, KB, MB, GB)
    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        // Full-width container for proper form layout
        <div className="w-full">
            {/* Form label with required indicator */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            {/* File selection button */}
            <button
                type="button"
                onClick={openFileDialog}
                disabled={disabled}
                className="mb-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Select Files
            </button>

            {/* Drag and drop zone */}
            <div
                className={`
          relative border-2 border-dashed border-gray-300 rounded-lg p-6
          ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${error ? "border-red-500" : ""}
          ${className}
        `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Hidden file input that handles the actual file selection */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    disabled={disabled}
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    {...props}
                />

                {/* Upload area content */}
                <div className="text-center">
                    <CloudArrowUpIcon
                        className="mx-auto h-12 w-12 text-gray-400"/>
                    <p className="mt-2 text-sm text-gray-600">
                        {dragActive
                            ? "Drop files here"
                            : 'Drag and drop files here, or click "Select Files" button above'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {multiple
                            ? "Maximum file size: 5MB per file"
                            : `Maximum file size: ${Math.round(maxSize / 1024 / 1024)}MB`}
                    </p>
                </div>

                {/* Selected files list */}
                {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Selected
                            Files:</h4>
                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded"
                            >
                                {/* File information */}
                                <div
                                    className="flex items-center space-x-3 flex-1">
                                    {/* File type indicator */}
                                    <div
                                        className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
										<span className="text-xs text-gray-600">
											{file.type.startsWith("image/") ? "IMG" : "FILE"}
										</span>
                                    </div>
                                    {/* File details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                {/* Remove file button */}
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                                    aria-label={`Remove ${file.name}`}
                                >
                                    <XMarkIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Error message display */}
            {(error || uploadError) && (
                <p className="mt-2 text-sm text-red-600">{error || uploadError}</p>
            )}
        </div>
    );
}

export default FileUpload;
