/**
 * Custom hook for form validation
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for validating form fields in real-time
 * @param {Object} formData - The form data to validate
 * @param {Object} validationRules - Rules for validation
 * @returns {Object} - Validation state and methods
 */
const useFormValidation = (formData, validationRules) => {
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  // Validate a single field
  const validateField = useCallback((name, value) => {
    if (!validationRules[name]) return '';

    const rules = validationRules[name];
    
    // Required validation
    if (rules.required && (!value || value === '')) {
      return rules.requiredMessage || 'This field is required';
    }
    
    // Email validation
    if (rules.isEmail && value) {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(value)) {
        return rules.emailMessage || 'Invalid email address';
      }
    }
    
    // Phone validation
    if (rules.isPhone && value) {
      const phoneRegex = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
      if (!phoneRegex.test(value)) {
        return rules.phoneMessage || 'Invalid phone number';
      }
    }
    
    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength) {
      return rules.minLengthMessage || `Must be at least ${rules.minLength} characters`;
    }
    
    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength) {
      return rules.maxLengthMessage || `Must be at most ${rules.maxLength} characters`;
    }
    
    // Pattern validation
    if (rules.pattern && value) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        return rules.patternMessage || 'Invalid format';
      }
    }
    
    // Custom validation
    if (rules.custom && typeof rules.custom === 'function') {
      const customError = rules.custom(value, formData);
      if (customError) {
        return customError;
      }
    }
    
    return '';
  }, [validationRules, formData]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    let formIsValid = true;
    
    Object.keys(validationRules).forEach(fieldName => {
      const value = formData[fieldName];
      const error = validateField(fieldName, value);
      
      if (error) {
        newErrors[fieldName] = error;
        formIsValid = false;
      }
    });
    
    setErrors(newErrors);
    setIsValid(formIsValid);
    
    return formIsValid;
  }, [formData, validationRules, validateField]);

  // Mark a field as touched
  const touchField = useCallback((fieldName) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
  }, []);

  // Validate on form data change
  useEffect(() => {
    validateForm();
  }, [formData, validateForm]);

  return {
    errors,
    isValid,
    touchedFields,
    touchField,
    validateField,
    validateForm
  };
};

export default useFormValidation;