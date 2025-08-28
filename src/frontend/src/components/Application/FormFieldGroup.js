import React from 'react';

/**
 * FormFieldGroup Component
 * 
 * A component for grouping related form fields with a title and description
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Form fields
 * @param {string} props.title - Group title
 * @param {string} props.description - Group description
 * @param {boolean} props.required - Whether the group contains required fields
 * @param {string} props.className - Additional CSS classes
 */
const FormFieldGroup = ({
  children,
  title,
  description,
  required = false,
  className = ''
}) => {
  return (
    <div className={`form-field-group mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
      {/* Group Header */}
      {title && (
        <div className="mb-4">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {required && (
              <span className="ml-2 text-xs font-semibold text-red-500">
                (Required)
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}

      {/* Group Content */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default FormFieldGroup;