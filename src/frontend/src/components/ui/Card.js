import React from 'react';

/**
 * Card component for displaying content in a contained box
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.hover=false] - Whether to add hover effects
 * @param {boolean} [props.padding=true] - Whether to add padding
 * @param {boolean} [props.shadow=true] - Whether to add shadow
 * @param {boolean} [props.border=true] - Whether to add border
 * @param {boolean} [props.rounded=true] - Whether to add rounded corners
 */
const Card = ({ 
  children, 
  className = '', 
  hover = false,
  padding = true,
  shadow = true,
  border = true,
  rounded = true,
  ...rest 
}) => {
  // Base classes
  const baseClasses = 'bg-white';
  
  // Optional classes
  const paddingClasses = padding ? 'p-4 sm:p-6' : '';
  const shadowClasses = shadow ? 'shadow-md' : '';
  const borderClasses = border ? 'border border-gray-200' : '';
  const roundedClasses = rounded ? 'rounded-lg' : '';
  const hoverClasses = hover ? 'transition-all duration-200 hover:shadow-lg' : '';
  
  // Combine all classes
  const cardClasses = `${baseClasses} ${paddingClasses} ${shadowClasses} ${borderClasses} ${roundedClasses} ${hoverClasses} ${className}`;
  
  return (
    <div className={cardClasses} {...rest}>
      {children}
    </div>
  );
};

export default Card;