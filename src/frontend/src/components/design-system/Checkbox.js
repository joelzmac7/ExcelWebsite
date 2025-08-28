import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import theme from './theme';

/**
 * Checkbox Component
 * 
 * A customizable checkbox component
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - Checkbox name
 * @param {string} props.id - Checkbox ID
 * @param {boolean} props.checked - Whether the checkbox is checked
 * @param {Function} props.onChange - Change handler
 * @param {React.ReactNode} props.label - Checkbox label
 * @param {boolean} props.disabled - Whether the checkbox is disabled
 * @param {boolean} props.error - Whether the checkbox has an error
 * @param {string} props.errorMessage - Error message to display
 * @param {string} props.helpText - Help text to display
 * @param {boolean} props.required - Whether the checkbox is required
 * @param {string} props.size - Checkbox size (sm, md, lg)
 * @param {string} props.className - Additional CSS classes
 */
const Checkbox = forwardRef(({
  name,
  id,
  checked,
  onChange,
  label,
  disabled = false,
  error = false,
  errorMessage,
  helpText,
  required = false,
  size = 'md',
  className = '',
  ...rest
}, ref) => {
  // Generate a unique ID if not provided
  const checkboxId = id || `checkbox-${name}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Size classes
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  
  // Label size classes
  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  // State classes
  const stateClasses = error
    ? 'border-danger-500 text-danger-600 focus:border-danger-500 focus:ring-danger-500'
    : disabled
      ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
      : 'border-gray-300 text-primary-600 focus:border-primary-500 focus:ring-primary-500';
  
  // Combine classes
  const checkboxClasses = `${sizeClasses[size]} ${stateClasses} rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2`;
  
  return (
    <div className={`flex ${className}`}>
      <div className="flex items-start">
        {/* Checkbox */}
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            name={name}
            id={checkboxId}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${checkboxId}-error`
                : helpText
                ? `${checkboxId}-description`
                : undefined
            }
            className={checkboxClasses}
            {...rest}
          />
        </div>
        
        {/* Label and Help Text */}
        <div className="ml-2 text-sm">
          {label && (
            <label
              htmlFor={checkboxId}
              className={`font-medium ${labelSizeClasses[size]} ${
                disabled ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              {label}
              {required && <span className="ml-1 text-danger-500">*</span>}
            </label>
          )}
          
          {/* Help Text */}
          {helpText && !error && (
            <p className="text-gray-500 text-xs mt-1" id={`${checkboxId}-description`}>
              {helpText}
            </p>
          )}
          
          {/* Error Message */}
          {error && errorMessage && (
            <p className="text-danger-600 text-xs mt-1" id={`${checkboxId}-error`}>
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

Checkbox.propTypes = {
  name: PropTypes.string,
  id: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.node,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  helpText: PropTypes.string,
  required: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default Checkbox;