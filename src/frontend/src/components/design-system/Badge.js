import React from 'react';
import PropTypes from 'prop-types';
import theme from './theme';

/**
 * Badge Component
 * 
 * A component for displaying short status descriptors
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.variant - Badge variant (primary, secondary, success, warning, danger, info)
 * @param {string} props.size - Badge size (sm, md, lg)
 * @param {boolean} props.rounded - Whether the badge should have fully rounded corners
 * @param {boolean} props.bordered - Whether the badge should have a border
 * @param {React.ReactNode} props.leftIcon - Icon to display on the left
 * @param {React.ReactNode} props.rightIcon - Icon to display on the right
 * @param {boolean} props.removable - Whether the badge is removable
 * @param {Function} props.onRemove - Function called when the remove button is clicked
 * @param {string} props.className - Additional CSS classes
 */
const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
  bordered = false,
  leftIcon,
  rightIcon,
  removable = false,
  onRemove,
  className = '',
  ...rest
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center font-medium';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };
  
  // Rounded classes
  const roundedClasses = rounded ? 'rounded-full' : 'rounded';
  
  // Variant classes
  const variantClasses = {
    primary: bordered
      ? 'bg-primary-50 text-primary-800 border border-primary-300'
      : 'bg-primary-100 text-primary-800',
    secondary: bordered
      ? 'bg-gray-50 text-gray-800 border border-gray-300'
      : 'bg-gray-100 text-gray-800',
    success: bordered
      ? 'bg-success-50 text-success-800 border border-success-300'
      : 'bg-success-100 text-success-800',
    warning: bordered
      ? 'bg-warning-50 text-warning-800 border border-warning-300'
      : 'bg-warning-100 text-warning-800',
    danger: bordered
      ? 'bg-danger-50 text-danger-800 border border-danger-300'
      : 'bg-danger-100 text-danger-800',
    info: bordered
      ? 'bg-blue-50 text-blue-800 border border-blue-300'
      : 'bg-blue-100 text-blue-800',
  };
  
  // Combine classes
  const badgeClasses = `${baseClasses} ${sizeClasses[size]} ${roundedClasses} ${variantClasses[variant]} ${className}`;
  
  // Remove button color classes
  const removeButtonClasses = {
    primary: 'text-primary-400 hover:text-primary-600',
    secondary: 'text-gray-400 hover:text-gray-600',
    success: 'text-success-400 hover:text-success-600',
    warning: 'text-warning-400 hover:text-warning-600',
    danger: 'text-danger-400 hover:text-danger-600',
    info: 'text-blue-400 hover:text-blue-600',
  };
  
  return (
    <span className={badgeClasses} {...rest}>
      {leftIcon && (
        <span className="mr-1 -ml-0.5">{leftIcon}</span>
      )}
      
      {children}
      
      {rightIcon && !removable && (
        <span className="ml-1 -mr-0.5">{rightIcon}</span>
      )}
      
      {removable && (
        <button
          type="button"
          className={`ml-1 -mr-0.5 flex-shrink-0 focus:outline-none focus:text-gray-700 ${removeButtonClasses[variant]}`}
          onClick={onRemove}
          aria-label="Remove"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  rounded: PropTypes.bool,
  bordered: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  removable: PropTypes.bool,
  onRemove: PropTypes.func,
  className: PropTypes.string,
};

export default Badge;