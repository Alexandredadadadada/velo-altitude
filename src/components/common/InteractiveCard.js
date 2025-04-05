import React from 'react';
import './InteractiveCard.css';

const InteractiveCard = ({ title, content, image, onClick, className = '' }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  return (
    <div 
      className={`interactive-card ${isHovered ? 'hovered' : ''} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {image && (
        <div className="card-image">
          <img src={image} alt={title} />
        </div>
      )}
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <div className="card-body">{content}</div>
      </div>
    </div>
  );
};

export default InteractiveCard;
