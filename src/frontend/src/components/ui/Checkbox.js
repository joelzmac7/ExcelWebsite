import React from 'react';
import PropTypes from 'prop-types';

/**
 * Checkbox component for boolean selection
 */
const Checkbox = ({
  id,
  name,
  label,
  checked,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  // Base classes
  const baseCheckboxClasses = 'h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500';
  
  // Error classes
  const errorClasses = error ? 'border-red-300 focus:ring-red-500' : '';
  
  // Disabled classes
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  // Combine checkbox classes
  const checkboxClasses = `
    ${baseCheckboxClasses}
    ${errorClasses}
    ${disabledClasses}
    ${className}
  `;
  
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={checkboxClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText ? `${id}-helper-text` : undefined}
          {...props}
        />
      </div>
      
      <div className="ml-3 text-sm">
        {label && (
          <label htmlFor={id} className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {(error || helperText) && (
          <p 
            id={`${id}-helper-text`} 
            className={`mt-1 ${error ? 'text-red-600' : 'text-gray-500'}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    </div>
  );
};

Checkbox.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  error: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
};

export default Checkbox;