import React from 'react';

/**
 * Badge component for displaying status or labels
 * 
 * @param {Object} props - Component props
 * @param {string} [props.variant='default'] - Badge variant (default, success, warning, error, info)
 * @param {string} [props.size='md'] - Badge size (sm, md, lg)
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} [props.className=''] - Additional CSS classes
 */
const Badge = ({ 
  variant = 'default', 
  size = 'md', 
  children, 
  className = '',
  ...rest 
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };
  
  // Variant classes
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  
  // Combine all classes
  const badgeClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  
  return (
    <span className={badgeClasses} {...rest}>
      {children}
    </span>
  );
};

export default Badge;