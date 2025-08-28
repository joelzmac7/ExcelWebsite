import React from 'react';

/**
 * FormStep Component
 * 
 * A component representing a single step in a multi-step form
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Step content
 * @param {string} props.title - Step title
 * @param {string} props.description - Step description
 * @param {Function} props.validate - Function to validate step data
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onChange - Function to update form data
 * @param {Object} props.errors - Form validation errors
 * @param {Function} props.setErrors - Function to update form errors
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 */
const FormStep = ({
  children,
  title,
  description,
  validate,
  formData,
  onChange,
  errors,
  setErrors,
  isSubmitting
}) => {
  return (
    <div className="form-step">
      {/* Step Header */}
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>
      )}

      {/* Step Content */}
      <div className="form-step-content">
        {React.Children.map(children, child => {
          // Pass down props to children if they're React elements
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              formData,
              onChange,
              errors,
              setErrors,
              isSubmitting,
              ...child.props
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

export default FormStep;