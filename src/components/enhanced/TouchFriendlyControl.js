import React from 'react';
import PropTypes from 'prop-types';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * TouchFriendlyControl Component
 * Creates a touch-friendly clickable area that meets accessibility standards
 * for touch targets (minimum 44x44px as per WCAG guidelines)
 */
const TouchFriendlyControl = ({ 
  children, 
  onPress, 
  className = '', 
  ariaLabel, 
  disabled = false,
  size = 'md',
  activeColor = 'var(--blue-light)',
  style = {}
}) => {
  // Determine the minimum size based on the size prop
  const getSizeStyle = () => {
    const sizes = {
      sm: { minHeight: '36px', minWidth: '36px' },
      md: { minHeight: '44px', minWidth: '44px' },
      lg: { minHeight: '56px', minWidth: '56px' }
    };
    
    return sizes[size] || sizes.md;
  };
  
  // Handle press event and add active state
  const [isPressed, setIsPressed] = React.useState(false);
  
  const handlePress = (e) => {
    if (disabled) return;
    if (onPress) onPress(e);
  };
  
  const handleMouseDown = () => {
    if (!disabled) setIsPressed(true);
  };
  
  const handleMouseUp = () => {
    if (!disabled) setIsPressed(false);
  };
  
  const handleTouchStart = () => {
    if (!disabled) setIsPressed(true);
  };
  
  const handleTouchEnd = () => {
    if (!disabled) setIsPressed(false);
  };
  
  // Determine if this control should render as a button element or div
  const isButtonLike = typeof onPress === 'function';
  
  // Style for the component
  const componentStyle = {
    ...getSizeStyle(),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    borderRadius: 'var(--border-radius-md)',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    userSelect: 'none',
    backgroundColor: isPressed ? activeColor : 'transparent',
    transform: isPressed ? 'scale(0.97)' : 'scale(1)',
    ...style
  };
  
  // Render as a button if it has onPress handler
  if (isButtonLike) {
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/touchfriendlycontrol"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
      <button
        onClick={handlePress}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={ariaLabel}
        aria-pressed={isPressed}
        disabled={disabled}
        className={`touch-friendly-control ${className}`}
        style={componentStyle}
        type="button" // Explicit type for accessibility
      >
        {children}
      </button>
    );
  }
  
  // Render as a div if it doesn't have onPress handler
  return (
    <div
      className={`touch-friendly-control ${className}`}
      style={componentStyle}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};

TouchFriendlyControl.propTypes = {
  children: PropTypes.node.isRequired,
  onPress: PropTypes.func,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  activeColor: PropTypes.string,
  style: PropTypes.object
};

export default TouchFriendlyControl;
