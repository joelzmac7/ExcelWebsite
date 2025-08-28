import React from 'react';
import Link from 'next/link';

/**
 * Button component with multiple variants
 * 
 * @param {Object} props - Component props
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, outline, text)
 * @param {string} [props.size='md'] - Button size (sm, md, lg)
 * @param {boolean} [props.fullWidth=false] - Whether button should take full width
 * @param {string} [props.href] - If provided, button will be rendered as a link
 * @param {React.ReactNode} props.children - Button content
 * @param {Object} props.rest - Additional props passed to button or link
 */
const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  href, 
  children, 
  className = '',
  ...rest 
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 border border-transparent',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 border border-transparent',
    outline: 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 border border-gray-300',
    text: 'bg-transparent text-primary-600 hover:text-primary-700 hover:bg-gray-50 focus:ring-primary-500 border border-transparent',
  };
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Combine all classes
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClasses} ${className}`;
  
  // Render as link if href is provided
  if (href) {
    return (
      <Link href={href} className={buttonClasses} {...rest}>
        {children}
      </Link>
    );
  }
  
  // Render as button
  return (
    <button className={buttonClasses} {...rest}>
      {children}
    </button>
  );
};

export default Button;