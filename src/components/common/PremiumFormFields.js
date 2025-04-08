import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import '../../design-system/styles/glassmorphism.scss';
import './PremiumFormFields.css';

/**
 * Champs de formulaire premium avec animations et effets visuels
 * 
 * Collection de composants de formulaire avec style glassmorphism,
 * animations fluides et validations intégrées
 */

// TextField - Champ de texte stylisé
export const TextField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  helperText,
  error,
  success,
  disabled = false,
  required = false,
  autoFocus = false,
  maxLength,
  icon,
  endIcon,
  onEndIconClick,
  onFocus,
  onBlur,
  className = '',
  animateLabel = true,
  variant = 'default', // 'default', 'filled', 'outline'
  size = 'medium', // 'small', 'medium', 'large'
  fullWidth = false
}) => {
  const [focused, setFocused] = useState(false);
  const [labelAnimated, setLabelAnimated] = useState(false);
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  useEffect(() => {
    // Animer le label si la valeur existe ou si le champ est focus
    setLabelAnimated(focused || (value && value.toString().length > 0));
  }, [focused, value]);
  
  const handleFocus = (e) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };
  
  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };
  
  // Définition des classes
  const variantClass = `premium-field--${variant}`;
  const sizeClass = `premium-field--${size}`;
  const stateClass = error
    ? 'premium-field--error'
    : success
      ? 'premium-field--success'
      : '';
  const widthClass = fullWidth ? 'premium-field--full-width' : '';
  
  return (
    <div className={`premium-field ${variantClass} ${sizeClass} ${stateClass} ${widthClass} ${className}`}>
      <div className={`premium-field__container ${focused ? 'premium-field__container--focused' : ''}`}>
        {icon && (
          <div className="premium-field__icon premium-field__icon--start">
            {icon}
          </div>
        )}
        
        <div className="premium-field__input-wrapper">
          {label && (
            <label
              htmlFor={id}
              className={`premium-field__label ${labelAnimated ? 'premium-field__label--animated' : ''}`}
            >
              {label}
              {required && <span className="premium-field__required">*</span>}
            </label>
          )}
          
          <input
            ref={inputRef}
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="premium-field__input"
            aria-invalid={!!error}
            aria-describedby={`${id}-helper-text`}
          />
        </div>
        
        {endIcon && (
          <div 
            className="premium-field__icon premium-field__icon--end"
            onClick={onEndIconClick ? onEndIconClick : undefined}
            style={{ cursor: onEndIconClick ? 'pointer' : 'default' }}
          >
            {endIcon}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {(helperText || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`premium-field__helper-text ${error ? 'premium-field__helper-text--error' : ''}`}
            id={`${id}-helper-text`}
          >
            {error || helperText}
          </motion.div>
        )}
      </AnimatePresence>
      
      {maxLength && value && (
        <div className="premium-field__counter">
          {value.toString().length}/{maxLength}
        </div>
      )}
    </div>
  );
};

TextField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  success: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  autoFocus: PropTypes.bool,
  maxLength: PropTypes.number,
  icon: PropTypes.node,
  endIcon: PropTypes.node,
  onEndIconClick: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  className: PropTypes.string,
  animateLabel: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'filled', 'outline']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool
};

// TextArea - Champ de texte multi-lignes
export const TextArea = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  helperText,
  error,
  success,
  disabled = false,
  required = false,
  autoFocus = false,
  maxLength,
  rows = 4,
  onFocus,
  onBlur,
  className = '',
  variant = 'default',
  size = 'medium',
  fullWidth = false,
  resizable = true
}) => {
  const [focused, setFocused] = useState(false);
  const [labelAnimated, setLabelAnimated] = useState(false);
  const textareaRef = useRef(null);
  
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);
  
  useEffect(() => {
    setLabelAnimated(focused || (value && value.toString().length > 0));
  }, [focused, value]);
  
  const handleFocus = (e) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };
  
  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };
  
  // Définition des classes
  const variantClass = `premium-field--${variant}`;
  const sizeClass = `premium-field--${size}`;
  const stateClass = error
    ? 'premium-field--error'
    : success
      ? 'premium-field--success'
      : '';
  const widthClass = fullWidth ? 'premium-field--full-width' : '';
  const resizableClass = resizable ? '' : 'premium-field--no-resize';
  
  return (
    <div className={`premium-field premium-field--textarea ${variantClass} ${sizeClass} ${stateClass} ${widthClass} ${resizableClass} ${className}`}>
      <div className={`premium-field__container ${focused ? 'premium-field__container--focused' : ''}`}>
        <div className="premium-field__input-wrapper">
          {label && (
            <label
              htmlFor={id}
              className={`premium-field__label ${labelAnimated ? 'premium-field__label--animated' : ''}`}
            >
              {label}
              {required && <span className="premium-field__required">*</span>}
            </label>
          )}
          
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            onFocus={handleFocus}
            onBlur={handleBlur}
            rows={rows}
            className="premium-field__textarea"
            aria-invalid={!!error}
            aria-describedby={`${id}-helper-text`}
          />
        </div>
      </div>
      
      <AnimatePresence>
        {(helperText || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`premium-field__helper-text ${error ? 'premium-field__helper-text--error' : ''}`}
            id={`${id}-helper-text`}
          >
            {error || helperText}
          </motion.div>
        )}
      </AnimatePresence>
      
      {maxLength && value && (
        <div className="premium-field__counter">
          {value.toString().length}/{maxLength}
        </div>
      )}
    </div>
  );
};

TextArea.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  success: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  autoFocus: PropTypes.bool,
  maxLength: PropTypes.number,
  rows: PropTypes.number,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'filled', 'outline']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  resizable: PropTypes.bool
};

// Checkbox - Case à cocher stylisée
export const Checkbox = ({
  id,
  label,
  checked,
  onChange,
  helperText,
  error,
  disabled = false,
  required = false,
  indeterminate = false,
  className = '',
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'default', // 'default', 'filled'
  color = 'primary' // 'primary', 'secondary', 'accent'
}) => {
  const checkboxRef = useRef(null);
  
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);
  
  // Définition des classes
  const sizeClass = `premium-checkbox--${size}`;
  const variantClass = `premium-checkbox--${variant}`;
  const colorClass = `premium-checkbox--${color}`;
  const stateClass = error ? 'premium-checkbox--error' : '';
  
  return (
    <div className={`premium-checkbox ${sizeClass} ${variantClass} ${colorClass} ${stateClass} ${className}`}>
      <label className="premium-checkbox__label">
        <div className="premium-checkbox__input-container">
          <input
            ref={checkboxRef}
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className="premium-checkbox__input"
            aria-invalid={!!error}
            aria-describedby={`${id}-helper-text`}
          />
          <div className="premium-checkbox__custom-input">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" 
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
        
        <span className="premium-checkbox__text">
          {label}
          {required && <span className="premium-checkbox__required">*</span>}
        </span>
      </label>
      
      <AnimatePresence>
        {(helperText || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`premium-checkbox__helper-text ${error ? 'premium-checkbox__helper-text--error' : ''}`}
            id={`${id}-helper-text`}
          >
            {error || helperText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Checkbox.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.node,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  helperText: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  indeterminate: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'filled']),
  color: PropTypes.oneOf(['primary', 'secondary', 'accent'])
};

// Radio - Bouton radio stylisé
export const Radio = ({
  id,
  name,
  label,
  value,
  checked,
  onChange,
  helperText,
  error,
  disabled = false,
  required = false,
  className = '',
  size = 'medium',
  variant = 'default',
  color = 'primary'
}) => {
  // Définition des classes
  const sizeClass = `premium-radio--${size}`;
  const variantClass = `premium-radio--${variant}`;
  const colorClass = `premium-radio--${color}`;
  const stateClass = error ? 'premium-radio--error' : '';
  
  return (
    <div className={`premium-radio ${sizeClass} ${variantClass} ${colorClass} ${stateClass} ${className}`}>
      <label className="premium-radio__label">
        <div className="premium-radio__input-container">
          <input
            id={id}
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className="premium-radio__input"
            aria-invalid={!!error}
            aria-describedby={`${id}-helper-text`}
          />
          <div className="premium-radio__custom-input">
            <div className="premium-radio__dot"></div>
          </div>
        </div>
        
        <span className="premium-radio__text">
          {label}
          {required && <span className="premium-radio__required">*</span>}
        </span>
      </label>
      
      <AnimatePresence>
        {(helperText || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`premium-radio__helper-text ${error ? 'premium-radio__helper-text--error' : ''}`}
            id={`${id}-helper-text`}
          >
            {error || helperText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Radio.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  helperText: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'filled']),
  color: PropTypes.oneOf(['primary', 'secondary', 'accent'])
};

// RadioGroup - Groupe de boutons radio
export const RadioGroup = ({
  name,
  label,
  options,
  value,
  onChange,
  helperText,
  error,
  required = false,
  disabled = false,
  className = '',
  size = 'medium',
  variant = 'default',
  color = 'primary',
  direction = 'vertical' // 'vertical', 'horizontal'
}) => {
  const directionClass = `premium-radio-group--${direction}`;
  
  return (
    <div className={`premium-radio-group ${directionClass} ${className}`}>
      {label && (
        <div className="premium-radio-group__label">
          {label}
          {required && <span className="premium-radio-group__required">*</span>}
        </div>
      )}
      
      <div className="premium-radio-group__options">
        {options.map((option) => (
          <Radio
            key={option.value}
            id={`${name}-${option.value}`}
            name={name}
            label={option.label}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            disabled={disabled || option.disabled}
            size={size}
            variant={variant}
            color={color}
          />
        ))}
      </div>
      
      <AnimatePresence>
        {(helperText || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`premium-radio-group__helper-text ${error ? 'premium-radio-group__helper-text--error' : ''}`}
          >
            {error || helperText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

RadioGroup.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      disabled: PropTypes.bool
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  helperText: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'filled']),
  color: PropTypes.oneOf(['primary', 'secondary', 'accent']),
  direction: PropTypes.oneOf(['vertical', 'horizontal'])
};

// Exporter tous les composants
const PremiumFormFields = {
  TextField,
  TextArea,
  Checkbox,
  Radio,
  RadioGroup
};

export default PremiumFormFields;
