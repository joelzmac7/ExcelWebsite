import React from 'react';
import PropTypes from 'prop-types';

/**
 * Select component for dropdown selection
 */
const Select = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  leadingIcon,
  ...props
}) => {
  // Base classes
  const baseSelectClasses = 'block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm';
  
  // Error classes
  const errorClasses = error 
    ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300';
  
  // Disabled classes
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
  
  // Icon padding classes
  const iconPaddingClasses = leadingIcon ? 'pl-10' : '';
  
  // Combine select classes
  const selectClasses = `
    ${baseSelectClasses}
    ${errorClasses}
    ${disabledClasses}
    ${iconPaddingClasses}
    ${className}
  `;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leadingIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leadingIcon}
          </div>
        )}
        
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={selectClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText ? `${id}-helper-text` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {(error || helperText) && (
        <p 
          id={`${id}-helper-text`} 
          className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};

Select.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  leadingIcon: PropTypes.node,
};

export default Select;