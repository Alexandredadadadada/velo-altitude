import React from 'react';
import PropTypes from 'prop-types';

/**
 * SkeletonLoader Component
 * Displays placeholder content while actual content is loading
 * Supports different types of skeleton loaders for different content types
 */
const SkeletonLoader = ({ type = 'text', lines = 1, width, height, className = '' }) => {
  const getSkeletonType = () => {
    switch (type) {
      case 'text':
        return (
          <div className="skeleton-text">
            {Array(lines).fill().map((_, i) => (
              <div 
                key={i} 
                className="skeleton-line" 
                style={{ 
                  width: i === lines - 1 && lines > 1 ? '70%' : '100%',
                  height: '12px',
                  marginBottom: '8px',
                  backgroundColor: 'var(--gray-light)',
                  borderRadius: 'var(--border-radius-sm)',
                  opacity: 1 - (i * 0.1)
                }} 
              />
            ))}
          </div>
        );
      
      case 'image':
        return (
          <div 
            className="skeleton-image" 
            style={{ 
              width: width || '100%', 
              height: height || '200px',
              backgroundColor: 'var(--gray-light)',
              borderRadius: 'var(--border-radius-sm)'
            }}
          />
        );
      
      case 'card':
        return (
          <div className="skeleton-card">
            <div 
              className="skeleton-image" 
              style={{ 
                width: '100%', 
                height: '120px',
                backgroundColor: 'var(--gray-light)',
                borderRadius: 'var(--border-radius-sm) var(--border-radius-sm) 0 0'
              }}
            />
            <div className="skeleton-card-content" style={{ padding: '16px' }}>
              <div 
                className="skeleton-title" 
                style={{ 
                  width: '85%', 
                  height: '20px',
                  backgroundColor: 'var(--gray-light)',
                  borderRadius: 'var(--border-radius-sm)',
                  marginBottom: '12px'
                }}
              />
              <div 
                className="skeleton-text" 
                style={{ 
                  width: '100%', 
                  height: '10px',
                  backgroundColor: 'var(--gray-light)',
                  borderRadius: 'var(--border-radius-sm)',
                  marginBottom: '8px'
                }}
              />
              <div 
                className="skeleton-text" 
                style={{ 
                  width: '92%', 
                  height: '10px',
                  backgroundColor: 'var(--gray-light)',
                  borderRadius: 'var(--border-radius-sm)',
                  marginBottom: '8px'
                }}
              />
              <div 
                className="skeleton-text" 
                style={{ 
                  width: '65%', 
                  height: '10px',
                  backgroundColor: 'var(--gray-light)',
                  borderRadius: 'var(--border-radius-sm)'
                }}
              />
            </div>
          </div>
        );
      
      case 'col-detail':
        return (
          <div className="skeleton-col-detail">
            <div 
              className="skeleton-header" 
              style={{ 
                width: '60%', 
                height: '32px',
                backgroundColor: 'var(--gray-light)',
                borderRadius: 'var(--border-radius-sm)',
                marginBottom: '24px'
              }}
            />
            <div className="skeleton-stats" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              {Array(4).fill().map((_, i) => (
                <div 
                  key={i} 
                  className="skeleton-stat" 
                  style={{ 
                    height: '80px',
                    backgroundColor: 'var(--gray-light)',
                    borderRadius: 'var(--border-radius-sm)'
                  }}
                />
              ))}
            </div>
            <div 
              className="skeleton-image" 
              style={{ 
                width: '100%', 
                height: '300px',
                backgroundColor: 'var(--gray-light)',
                borderRadius: 'var(--border-radius-sm)',
                marginBottom: '24px'
              }}
            />
            <div className="skeleton-text">
              {Array(5).fill().map((_, i) => (
                <div 
                  key={i} 
                  className="skeleton-line" 
                  style={{ 
                    width: i === 4 ? '50%' : '100%',
                    height: '12px',
                    marginBottom: '8px',
                    backgroundColor: 'var(--gray-light)',
                    borderRadius: 'var(--border-radius-sm)'
                  }} 
                />
              ))}
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className="skeleton-profile" style={{ display: 'flex', alignItems: 'center' }}>
            <div 
              className="skeleton-avatar" 
              style={{ 
                width: '64px', 
                height: '64px',
                backgroundColor: 'var(--gray-light)',
                borderRadius: '50%',
                marginRight: '16px'
              }}
            />
            <div className="skeleton-details">
              <div 
                className="skeleton-name" 
                style={{ 
                  width: '120px', 
                  height: '20px',
                  backgroundColor: 'var(--gray-light)',
                  borderRadius: 'var(--border-radius-sm)',
                  marginBottom: '8px'
                }}
              />
              <div 
                className="skeleton-bio" 
                style={{ 
                  width: '180px', 
                  height: '12px',
                  backgroundColor: 'var(--gray-light)',
                  borderRadius: 'var(--border-radius-sm)'
                }}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`skeleton-loader ${className}`} style={{ 
      animation: 'pulse 1.5s ease-in-out infinite',
      width: width || 'auto',
      height: height || 'auto',
    }}>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>
      {getSkeletonType()}
    </div>
  );
};

SkeletonLoader.propTypes = {
  type: PropTypes.oneOf(['text', 'image', 'card', 'col-detail', 'profile']),
  lines: PropTypes.number,
  width: PropTypes.string,
  height: PropTypes.string,
  className: PropTypes.string
};

export default SkeletonLoader;
