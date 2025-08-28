import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import theme from './theme';

/**
 * Input Component
 * 
 * A versatile input component with various states and styles
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.name - Input name
 * @param {string} props.id - Input ID
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {Function} props.onFocus - Focus handler
 * @param {string} props.placeholder - Input placeholder
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {boolean} props.readOnly - Whether the input is read-only
 * @param {boolean} props.error - Whether the input has an error
 * @param {string} props.errorMessage - Error message to display
 * @param {string} props.helpText - Help text to display
 * @param {string} props.label - Input label
 * @param {boolean} props.required - Whether the input is required
 * @param {string} props.size - Input size (sm, md, lg)
 * @param {React.ReactNode} props.leftIcon - Icon to display on the left
 * @param {React.ReactNode} props.rightIcon - Icon to display on the right
 * @param {string} props.className - Additional CSS classes
 */
const Input = forwardRef(({
  type = 'text',
  name,
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  disabled = false,
  readOnly = false,
  error = false,
  errorMessage,
  helpText,
  label,
  required = false,
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  ...rest
}, ref) => {
  // Generate a unique ID if not provided
  const inputId = id || `input-${name}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Base classes
  const baseClasses = 'block w-full border transition-colors duration-200 focus:outline-none focus:ring-2';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm rounded',
    md: 'px-3 py-2 text-base rounded-md',
    lg: 'px-4 py-3 text-lg rounded-md',
  };
  
  // State classes
  const stateClasses = error
    ? 'border-danger-500 text-danger-900 placeholder-danger-300 focus:border-danger-500 focus:ring-danger-500'
    : disabled
      ? 'border-gray-200 bg-gray-100 text-gray-500 placeholder-gray-400 cursor-not-allowed'
      : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500';
  
  // Icon classes
  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon;
  const leftIconClasses = hasLeftIcon ? 'pl-10' : '';
  const rightIconClasses = hasRightIcon ? 'pr-10' : '';
  
  // Combine classes
  const inputClasses = `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${leftIconClasses} ${rightIconClasses} ${className}`;
  
  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="ml-1 text-danger-500">*</span>}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{leftIcon}</span>
          </div>
        )}
        
        {/* Input Element */}
        <input
          ref={ref}
          type={type}
          name={name}
          id={inputId}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helpText
              ? `${inputId}-description`
              : undefined
          }
          className={inputClasses}
          {...rest}
        />
        
        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{rightIcon}</span>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && errorMessage && (
        <p className="mt-1 text-sm text-danger-600" id={`${inputId}-error`}>
          {errorMessage}
        </p>
      )}
      
      {/* Help Text */}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500" id={`${inputId}-description`}>
          {helpText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  helpText: PropTypes.string,
  label: PropTypes.string,
  required: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  className: PropTypes.string,
};

export default Input;