import React from 'react';

/**
 * FormField Component
 * 
 * A component for rendering form fields with labels, error messages, and help text
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Form input element
 * @param {string} props.label - Field label
 * @param {string} props.name - Field name
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.error - Error message
 * @param {string} props.helpText - Help text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showErrorMessage - Whether to show error message
 */
const FormField = ({
  children,
  label,
  name,
  required = false,
  error,
  helpText,
  className = '',
  showErrorMessage = true
}) => {
  // Generate a unique ID for the input
  const id = `field-${name}`;
  
  // Determine if there's an error
  const hasError = !!error;

  return (
    <div className={`form-field ${hasError ? 'has-error' : ''} ${className}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* Input Element */}
      <div className="mt-1">
        {React.cloneElement(children, {
          id,
          name,
          'aria-invalid': hasError,
          'aria-describedby': hasError ? `${id}-error` : helpText ? `${id}-description` : undefined,
          className: `${children.props.className || ''} ${hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`
        })}
      </div>

      {/* Error Message */}
      {hasError && showErrorMessage && (
        <p className="mt-1 text-sm text-red-600" id={`${id}-error`}>
          {error}
        </p>
      )}

      {/* Help Text */}
      {helpText && !hasError && (
        <p className="mt-1 text-sm text-gray-500" id={`${id}-description`}>
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormField;