/**
 * Custom hook for auto-saving form data
 */
import { useEffect, useCallback } from 'react';

/**
 * Hook for automatically saving form data to localStorage
 * @param {Object} formData - The form data to save
 * @param {string} formKey - The key to use for localStorage
 * @param {number} delay - Delay in milliseconds between saves
 * @returns {Object} - Methods for managing auto-save
 */
const useAutoSave = (formData, formKey, delay = 2000) => {
  // Load saved data from localStorage
  const loadSavedData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(formKey);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
    return null;
  }, [formKey]);

  // Save data to localStorage
  const saveData = useCallback(() => {
    try {
      localStorage.setItem(formKey, JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [formData, formKey]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(formKey);
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  }, [formKey]);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      saveData();
    }, delay);

    return () => clearTimeout(timer);
  }, [formData, saveData, delay]);

  return {
    loadSavedData,
    saveData,
    clearSavedData
  };
};

export default useAutoSave;