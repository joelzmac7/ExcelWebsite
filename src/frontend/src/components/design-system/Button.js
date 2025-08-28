import React from 'react';
import PropTypes from 'prop-types';
import theme from './theme';

/**
 * Button Component
 * 
 * A versatile button component with multiple variants and sizes
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant (primary, secondary, outline, danger, success)
 * @param {string} props.size - Button size (xs, sm, md, lg, xl)
 * @param {boolean} props.fullWidth - Whether the button should take full width
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {boolean} props.loading - Whether the button is in loading state
 * @param {React.ReactNode} props.leftIcon - Icon to display on the left
 * @param {React.ReactNode} props.rightIcon - Icon to display on the right
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  type = 'button',
  onClick,
  className = '',
  children,
  ...rest
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Size classes
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs rounded',
    sm: 'px-3 py-2 text-sm leading-4 rounded',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-4 py-2 text-base rounded-md',
    xl: 'px-6 py-3 text-base rounded-md',
  };
  
  // Variant classes
  const variantClasses = {
    primary: `bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    secondary: `bg-gray-200 hover:bg-gray-300 focus:ring-gray-400 text-gray-800 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    outline: `bg-transparent border border-primary-600 hover:bg-gray-100 focus:ring-primary-500 text-primary-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    danger: `bg-danger-600 hover:bg-danger-700 focus:ring-danger-500 text-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    success: `bg-success-600 hover:bg-success-700 focus:ring-success-500 text-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    link: `bg-transparent hover:underline focus:ring-primary-500 text-primary-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
  };
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Combine classes
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClasses} ${className}`;
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      
      {leftIcon && !loading && (
        <span className="mr-2">{leftIcon}</span>
      )}
      
      {children}
      
      {rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'danger', 'success', 'link']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Button;