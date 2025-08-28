import React from 'react';
import PropTypes from 'prop-types';
import theme from './theme';

/**
 * Card Component
 * 
 * A versatile card component for displaying content in a contained format
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.title - Card title
 * @param {React.ReactNode} props.titleAction - Action element to display in the title area
 * @param {React.ReactNode} props.footer - Footer content
 * @param {boolean} props.hoverable - Whether the card should have hover effects
 * @param {boolean} props.bordered - Whether the card should have a border
 * @param {string} props.variant - Card variant (default, flat, elevated)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 */
const Card = ({
  children,
  title,
  titleAction,
  footer,
  hoverable = false,
  bordered = true,
  variant = 'default',
  className = '',
  onClick,
  ...rest
}) => {
  // Base classes
  const baseClasses = 'overflow-hidden rounded-lg';
  
  // Variant classes
  const variantClasses = {
    default: 'bg-white',
    flat: 'bg-gray-50',
    elevated: 'bg-white shadow-md',
  };
  
  // Border classes
  const borderClasses = bordered ? 'border border-gray-200' : '';
  
  // Hover classes
  const hoverClasses = hoverable
    ? 'transition-shadow duration-200 hover:shadow-lg'
    : '';
  
  // Click classes
  const clickClasses = onClick ? 'cursor-pointer' : '';
  
  // Combine classes
  const cardClasses = `${baseClasses} ${variantClasses[variant]} ${borderClasses} ${hoverClasses} ${clickClasses} ${className}`;
  
  return (
    <div
      className={cardClasses}
      onClick={onClick}
      {...rest}
    >
      {/* Card Header */}
      {(title || titleAction) && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          {title && (
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          )}
          {titleAction && (
            <div className="flex-shrink-0">{titleAction}</div>
          )}
        </div>
      )}
      
      {/* Card Body */}
      <div className="px-4 py-4">
        {children}
      </div>
      
      {/* Card Footer */}
      {footer && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  titleAction: PropTypes.node,
  footer: PropTypes.node,
  hoverable: PropTypes.bool,
  bordered: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'flat', 'elevated']),
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default Card;