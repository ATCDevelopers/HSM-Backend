import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import Input from "../../components/atoms/forms/Input";
import Select from "../../components/atoms/forms/Select";
import TextArea from "../../components/atoms/forms/TextArea";
import CheckBox from "../../components/atoms/forms/CheckBox";
import Radio from "../../components/atoms/forms/Radio";
import ToggleSwitch from "../../components/atoms/forms/ToggleSwitch";
import FileUpload from "../../components/atoms/forms/FileUpload";
import DateTimePicker from "../../components/atoms/forms/DateTimePicker";
import FieldSet from "../../components/atoms/forms/FieldSet";
import Button from "../../components/atoms/ui/Button";
import {resourceSchemas} from "../../config/resourceSchemas";

/**
 * Form Component - A comprehensive form builder with validation and multiple field types
 *
 * This component provides a powerful form interface that dynamically renders different
 * field types based on configuration. Features built-in validation, error handling,
 * loading states, and consistent styling. Perfect for complex forms, user registration,
 * data collection, and any structured input requirements.
 *
 * Common use cases:
 * - User registration and login forms
 * - Contact forms and feedback collection
 * - Settings and preference forms
 * - Data entry and CRUD operations
 * - Multi-step forms and wizards
 * - Survey and questionnaire forms
 *
 * @param {string} resource - Resource key to look up in resourceSchemas (for CRUD)
 * @param {Array} fields - Array of field configuration objects
 * @param {Object} initialValues - Initial form data values
 * @param {Function} onSubmit - Function called when form is submitted: (formData) => {}
 * @param {Function} onCancel - Function called when cancel button is clicked: () => {}
 * @param {boolean} loading - Whether the form is in loading state
 * @param {string} className - Additional CSS classes for the form
 * @param {string} submitText - Text for submit button (default: "Submit")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {boolean} showSubmit - Whether to show submit button (default: true)
 * @param {boolean} showCancel - Whether to show cancel button (default: true)
 * @param {...any} props - Additional form attributes to spread
 *
 * @example
 * // Basic user registration form
 * <Form
 *   fields={[
 *     { name: "name", type: "input", label: "Full Name", required: true },
 *     { name: "email", type: "input", inputType: "email", label: "Email", required: true },
 *     { name: "password", type: "input", inputType: "password", label: "Password", required: true },
 *     { name: "role", type: "select", label: "Role", options: roleOptions, required: true }
 *   ]}
 *   initialValues={{}}
 *   onSubmit={handleRegistration}
 *   loading={isRegistering}
 * />
 *
 * @example
 * // CRUD form using resource schema
 * <Form resource="patients" />
 *
 * @example
 * // Complex form with fieldsets and validation
 * <Form
 *   fields={[
 *     {
 *       type: "fieldset",
 *       legend: "Personal Information",
 *       fields: [
 *         { name: "firstName", type: "input", label: "First Name", required: true },
 *         { name: "lastName", type: "input", label: "Last Name", required: true }
 *       ]
 *     },
 *     {
 *       type: "fieldset",
 *       legend: "Preferences",
 *       fields: [
 *         { name: "newsletter", type: "checkbox", label: "Subscribe to newsletter" },
 *         { name: "theme", type: "toggle", label: "Enable dark mode" }
 *       ]
 *     }
 *   ]}
 *   initialValues={userPreferences}
 *   onSubmit={updatePreferences}
 *   submitText="Save Changes"
 * />
 *
 * @example
 * // Form with custom validation
 * <Form
 *   fields={[
 *     {
 *       name: "email",
 *       type: "input",
 *       inputType: "email",
 *       label: "Email",
 *       required: true,
 *       validation: (value) => {
 *         if (!value.includes("@")) return "Invalid email format";
 *         return true;
 *       }
 *     }
 *   ]}
 *   onSubmit={handleSubmit}
 * />
 */
interface FormProps {
    resource?: string;
    fields?: any[];
    initialValues?: Record<string, any>;
    onSubmit?: (formData: Record<string, any>) => void | Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
    className?: string;
    submitText?: string;
    cancelText?: string;
    showSubmit?: boolean;
    showCancel?: boolean;
    [key: string]: any;
}

function Form({
                  resource,
                  fields,
                  initialValues,
                  onSubmit,
                  onCancel,
                  loading,
                  className = "",
                  submitText,
                  cancelText,
                  showSubmit = true,
                  showCancel = true,
                  ...props
              }: FormProps) {
    const {id} = useParams();
    const navigate = useNavigate();
    
    // Derive props from resource schema if resource prop is provided
    let derivedFields = fields || [];
    let derivedInitialValues = initialValues || {};
    let derivedOnSubmit = onSubmit;
    let derivedOnCancel = onCancel;
    let derivedLoading = loading || false;
    let derivedSubmitText = submitText || "Submit";
    let derivedCancelText = cancelText || "Cancel";
    const [isResourceMode, setIsResourceMode] = useState(false);

    if (resource && resourceSchemas[resource]) {
        setIsResourceMode(true);
        const schema = resourceSchemas[resource];
        
        // Convert schema fields to form fields
        derivedFields = schema.fields.map(field => ({
            name: field.key,
            type: field.type === "textarea" ? "textarea" : 
                  field.type === "select" ? "select" :
                  field.type === "date" ? "date" : "input",
            label: field.label,
            required: field.required,
            options: field.options,
            ...(field.type === "text" && { inputType: "text" }),
            ...(field.type === "email" && { inputType: "email" }),
            ...(field.type === "tel" && { inputType: "tel" }),
            ...(field.type === "number" && { inputType: "number" }),
        }));

        // Fetch existing data if editing
        useEffect(() => {
            if (id) {
                schema.api.getById(id)
                    .then(response => {
                        const raw = response.data;
                        const data = Array.isArray(raw) ? raw[0] : (raw?.data || raw);
                        setFormData(data);
                    })
                    .catch(err => {
                        console.error("Failed to load resource:", err);
                    });
            }
        }, [id, schema.api]);

        // Override submit handler for resource mode
        derivedOnSubmit = async (formData) => {
            try {
                if (id) {
                    await schema.api.update(id, formData);
                } else {
                    await schema.api.create(formData);
                }
                navigate(`/${resource}`);
            } catch (err) {
                console.error("Failed to save:", err);
                throw err;
            }
        };

        // Override cancel handler for resource mode
        derivedOnCancel = () => {
            navigate(`/${resource}`);
        };

        derivedSubmitText = id ? "Update" : "Create";
    }

    const [formData, setFormData] = useState(derivedInitialValues);
    const [errors, setErrors] = useState({});

    const componentMap = {
        input: Input,
        select: Select,
        textarea: TextArea,
        checkbox: CheckBox,
        radio: Radio,
        toggle: ToggleSwitch,
        file: FileUpload,
        date: DateTimePicker,
        fieldset: FieldSet,
    };

    const handleChange = (name, value) => {
        setFormData((prev) => ({...prev, [name]: value}));
        setErrors((prev) => ({...prev, [name]: ""}));
    };

    const validateField = (field, value) => {
        if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
            return `${field.label || field.name} is required`;
        }
        if (field.validation) {
            const result = field.validation(value, formData);
            if (result !== true) return result;
        }
        return "";
    };

    const validateFields = (fieldsToValidate, newErrors) => {
        fieldsToValidate.forEach((field) => {
            if (field.type === "fieldset") {
                validateFields(field.fields || [], newErrors);
            } else {
                const error = validateField(field, formData[field.name]);
                if (error) newErrors[field.name] = error;
            }
        });
    };

    const validateForm = () => {
        const newErrors = {};
        validateFields(derivedFields, newErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) derivedOnSubmit(formData);
    };

    const renderField = (field, index) => {
        const Component = componentMap[field.type];
        if (!Component) return null;

        if (field.type === "fieldset") {
            return (
                <Component
                    key={field.legend || `fieldset-${index}`}
                    legend={field.legend}
                    className={field.className}
                >
                    <div className={field.fieldsClassName || "space-y-4"}>
                        {field.fields?.map((subField, subIndex) => renderField(subField, subIndex))}
                    </div>
                </Component>
            );
        }

        const commonProps = {
            key: field.name || `field-${index}`,
            label: field.label,
            onChange: (value) => handleChange(field.name, value),
            error: errors[field.name] || "",
            disabled: field.disabled || loading,
            required: field.required,
            className: field.className,
        };

        let specificProps = {};
        switch (field.type) {
            case "input":
                specificProps = {
                    value: formData[field.name] || "",
                    type: field.inputType || "text",
                    placeholder: field.placeholder,
                    maxLength: field.maxLength,
                    minLength: field.minLength,
                    onChange: (e) => handleChange(field.name, e.target.value),
                };
                break;
            case "select":
                specificProps = {
                    value: formData[field.name] || "",
                    options: field.options,
                    placeholder: field.placeholder,
                };
                break;
            case "textarea":
                specificProps = {
                    value: formData[field.name] || "",
                    placeholder: field.placeholder,
                    rows: field.rows,
                    maxLength: field.maxLength,
                    onChange: (e) => handleChange(field.name, e.target.value),
                };
                break;
            case "checkbox":
            case "toggle":
                specificProps = {
                    checked: !!formData[field.name],
                };
                break;
            case "radio":
                specificProps = {
                    value: formData[field.name] || "",
                    options: field.options,
                };
                break;
            case "file":
                specificProps = {
                    value: formData[field.name],
                    accept: field.accept,
                    multiple: field.multiple,
                    maxSize: field.maxSize,
                    onChange: undefined, // Use onFileSelect instead
                    onFileSelect: (file) => handleChange(field.name, file),
                };
                break;
            case "date":
                specificProps = {
                    value: formData[field.name] || "",
                    showTime: field.showTime,
                    placeholder: field.placeholder,
                };
                break;
            default:
                specificProps = {value: formData[field.name] || ""};
        }

        return <Component {...commonProps} {...specificProps} />;
    };

    return (
        <form onSubmit={handleSubmit}
              className={`space-y-6 ${className}`} {...props}>
            {derivedFields.map((field, index) => renderField(field, index))}
            {(showSubmit || showCancel) && (
                <div
                    className="flex items-center justify-end space-x-3 pt-4 border-t">
                    {showCancel && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={derivedOnCancel}
                            disabled={derivedLoading}
                        >
                            {cancelText}
                        </Button>
                    )}
                    {showSubmit && (
                        <Button
                            type="submit"
                            variant="primary"
                            loading={derivedLoading}
                            disabled={derivedLoading}
                            onClick={handleSubmit}
                        >
                            {derivedSubmitText}
                        </Button>
                    )}
                </div>
            )}
        </form>
    );
}

export default Form;
