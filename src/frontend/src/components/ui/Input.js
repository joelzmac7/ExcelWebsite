import React from 'react';
import PropTypes from 'prop-types';

/**
 * Input component for text entry
 */
const Input = ({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  leadingIcon,
  trailingIcon,
  ...props
}) => {
  // Base classes
  const baseInputClasses = 'block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm';
  
  // Error classes
  const errorClasses = error 
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300';
  
  // Disabled classes
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
  
  // Icon padding classes
  const iconPaddingClasses = leadingIcon ? 'pl-10' : (trailingIcon ? 'pr-10' : '');
  
  // Combine input classes
  const inputClasses = `
    ${baseInputClasses}
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
        
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText ? `${id}-helper-text` : undefined}
          {...props}
        />
        
        {trailingIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {trailingIcon}
          </div>
        )}
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

Input.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  leadingIcon: PropTypes.node,
  trailingIcon: PropTypes.node,
};

export default Input;