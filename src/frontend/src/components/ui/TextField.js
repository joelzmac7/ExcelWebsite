import React from 'react';

/**
 * TextField component for text input
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.name - Input name
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.label] - Input label
 * @param {string} [props.placeholder] - Input placeholder
 * @param {string} [props.value] - Input value
 * @param {function} [props.onChange] - Input change handler
 * @param {string} [props.error] - Error message
 * @param {string} [props.helperText] - Helper text
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {boolean} [props.required=false] - Whether input is required
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {React.ReactNode} [props.startIcon] - Icon to display at start of input
 * @param {React.ReactNode} [props.endIcon] - Icon to display at end of input
 */
const TextField = ({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  startIcon,
  endIcon,
  ...rest
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
  const iconPaddingClasses = startIcon ? 'pl-10' : endIcon ? 'pr-10' : '';
  
  // Combine input classes
  const inputClasses = `${baseInputClasses} ${errorClasses} ${disabledClasses} ${iconPaddingClasses} ${className}`;
  
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {startIcon}
          </div>
        )}
        
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText ? `${id}-helper-text` : undefined}
          {...rest}
        />
        
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {endIcon}
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

export default TextField;