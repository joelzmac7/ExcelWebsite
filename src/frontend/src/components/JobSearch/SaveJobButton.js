import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../ui';

/**
 * SaveJobButton Component
 * 
 * A button component for saving/bookmarking jobs
 * 
 * @param {Object} props - Component props
 * @param {string} props.jobId - ID of the job to save
 * @param {boolean} props.initialSaved - Whether the job is initially saved
 * @param {Function} props.onSaveToggle - Callback when save status changes
 * @param {string} props.variant - Button variant (default, outline, text)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.showText - Whether to show text alongside icon
 */
const SaveJobButton = ({
  jobId,
  initialSaved = false,
  onSaveToggle,
  variant = 'outline',
  size = 'md',
  showText = true
}) => {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update local state when initialSaved prop changes
  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  // Handle save/unsave action
  const handleToggleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Toggle saved state
      const newSavedState = !isSaved;
      
      // In a real implementation, this would call an API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setIsSaved(newSavedState);
      
      // Call the callback if provided
      if (onSaveToggle) {
        onSaveToggle(jobId, newSavedState);
      }
    } catch (err) {
      console.error('Error toggling job save status:', err);
      setError('Failed to update saved status');
      
      // Revert to previous state on error
      setIsSaved(isSaved);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleToggleSave}
        disabled={isLoading}
        className={`save-job-button ${isSaved ? 'saved' : ''}`}
        aria-label={isSaved ? 'Unsave job' : 'Save job'}
        title={isSaved ? 'Unsave job' : 'Save job'}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg 
            className={`h-4 w-4 ${showText ? 'mr-1' : ''} ${isSaved ? 'text-red-500 fill-current' : ''}`} 
            xmlns="http://www.w3.org/2000/svg" 
            fill={isSaved ? 'currentColor' : 'none'} 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
        )}
        {showText && (isSaved ? 'Saved' : 'Save')}
      </Button>
      
      {error && (
        <div className="mt-1 text-xs text-red-600">
          {error}
        </div>
      )}
    </>
  );
};

SaveJobButton.propTypes = {
  jobId: PropTypes.string.isRequired,
  initialSaved: PropTypes.bool,
  onSaveToggle: PropTypes.func,
  variant: PropTypes.string,
  size: PropTypes.string,
  showText: PropTypes.bool
};

export default SaveJobButton;