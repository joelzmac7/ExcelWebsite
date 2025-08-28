import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import theme from './theme';

/**
 * Select Component
 * 
 * A customizable select dropdown component
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - Select name
 * @param {string} props.id - Select ID
 * @param {string|number} props.value - Selected value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {Function} props.onFocus - Focus handler
 * @param {Array} props.options - Options array with value and label properties
 * @param {boolean} props.disabled - Whether the select is disabled
 * @param {boolean} props.error - Whether the select has an error
 * @param {string} props.errorMessage - Error message to display
 * @param {string} props.helpText - Help text to display
 * @param {string} props.label - Select label
 * @param {boolean} props.required - Whether the select is required
 * @param {string} props.size - Select size (sm, md, lg)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.placeholder - Placeholder text for empty selection
 */
const Select = forwardRef(({
  name,
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  options = [],
  disabled = false,
  error = false,
  errorMessage,
  helpText,
  label,
  required = false,
  size = 'md',
  className = '',
  placeholder = 'Select an option',
  ...rest
}, ref) => {
  // Generate a unique ID if not provided
  const selectId = id || `select-${name}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Base classes
  const baseClasses = 'block w-full border transition-colors duration-200 focus:outline-none focus:ring-2 appearance-none bg-no-repeat';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm rounded',
    md: 'px-3 py-2 text-base rounded-md',
    lg: 'px-4 py-3 text-lg rounded-md',
  };
  
  // State classes
  const stateClasses = error
    ? 'border-danger-500 text-danger-900 focus:border-danger-500 focus:ring-danger-500'
    : disabled
      ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
      : 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500';
  
  // Combine classes
  const selectClasses = `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${className} pr-10 bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")] bg-[right_0.5rem_center] bg-[length:1.5em_1.5em]`;
  
  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="ml-1 text-danger-500">*</span>}
        </label>
      )}
      
      {/* Select Container */}
      <div className="relative">
        {/* Select Element */}
        <select
          ref={ref}
          name={name}
          id={selectId}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${selectId}-error`
              : helpText
              ? `${selectId}-description`
              : undefined
          }
          className={selectClasses}
          {...rest}
        >
          {/* Placeholder Option */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {/* Options */}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Error Message */}
      {error && errorMessage && (
        <p className="mt-1 text-sm text-danger-600" id={`${selectId}-error`}>
          {errorMessage}
        </p>
      )}
      
      {/* Help Text */}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500" id={`${selectId}-description`}>
          {helpText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  name: PropTypes.string,
  id: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  helpText: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  placeholder: PropTypes.string,
};

export default Select;