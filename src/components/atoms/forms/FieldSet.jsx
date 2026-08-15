/**
 * FieldSet Component - A semantic form grouping component with optional legend
 *
 * This component provides a structured way to group related form fields using
 * the HTML5 fieldset element. Perfect for organizing complex forms into logical
 * sections with proper accessibility support.
 *
 * Common use cases:
 * - Grouping related form fields (personal info, contact details, preferences)
 * - Creating form sections with clear visual separation
 * - Organizing multi-step forms and wizards
 * - Grouping checkbox or radio button sets
 * - Creating collapsible form sections
 *
 * @param {string} legend - Optional title/legend text displayed above the fieldset
 * @param {React.ReactNode} children - Form fields and content to display inside the fieldset
 * @param {string} className - Additional CSS classes for styling the fieldset
 * @param {...any} props - Additional fieldset attributes to spread
 *
 * @example
 * // Basic fieldset with legend
 * <FieldSet legend="Personal Information">
 *   <Input label="First Name" name="firstName" />
 *   <Input label="Last Name" name="lastName" />
 *   <Input label="Email" name="email" type="email" />
 * </FieldSet>
 *
 * @example
 * // Fieldset without legend for grouping related fields
 * <FieldSet>
 *   <CheckBox label="Send me newsletters" name="newsletter" />
 *   <CheckBox label="Email notifications" name="notifications" />
 *   <CheckBox label="SMS alerts" name="sms" />
 * </FieldSet>
 *
 * @example
 * // Fieldset with custom styling
 * <FieldSet
 *   legend="Address Information"
 *   className="bg-gray-50 border-2 border-blue-200"
 * >
 *   <Input label="Street Address" name="address" />
 *   <Input label="City" name="city" />
 *   <Input label="Postal Code" name="postalCode" />
 * </FieldSet>
 *
 * @example
 * // Nested fieldsets for complex forms
 * <FieldSet legend="Account Settings">
 *   <FieldSet legend="Profile Information">
 *     <Input label="Username" name="username" />
 *     <Input label="Display Name" name="displayName" />
 *   </FieldSet>
 *   <FieldSet legend="Security">
 *     <Input label="Current Password" name="currentPassword" type="password" />
 *     <Input label="New Password" name="newPassword" type="password" />
 *   </FieldSet>
 * </FieldSet>
 */
function FieldSet({legend, children, className = "", ...props}) {
    return (
        // Semantic fieldset element for grouping related form fields
        <fieldset
            className={`border border-gray-200 rounded-lg p-4 ${className}`} {...props}>
            {/* Optional legend/title for the fieldset */}
            {legend && <legend
                className="text-lg font-medium text-gray-900 mb-4">{legend}</legend>}

            {/* Container for form fields with consistent spacing */}
            <div className="space-y-4">{children}</div>
        </fieldset>
    );
}

export default FieldSet;
