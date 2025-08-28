import React, { useState, useEffect } from 'react';
import { Button } from '../ui';

/**
 * MultiStepForm Component
 * 
 * A reusable component for creating multi-step forms with progress tracking
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode[]} props.children - Form steps as child components
 * @param {Function} props.onSubmit - Function called when form is submitted
 * @param {Function} props.onCancel - Function called when form is cancelled
 * @param {Object} props.initialData - Initial form data
 * @param {boolean} props.showProgressBar - Whether to show the progress bar
 * @param {string} props.formId - Unique identifier for the form (for auto-save)
 */
const MultiStepForm = ({
  children,
  onSubmit,
  onCancel,
  initialData = {},
  showProgressBar = true,
  formId = 'multi-step-form'
}) => {
  // Validate that children are provided
  const steps = React.Children.toArray(children);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [touchedSteps, setTouchedSteps] = useState([]);

  // Calculate progress percentage
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Update touched steps when navigating
  useEffect(() => {
    if (!touchedSteps.includes(currentStep)) {
      setTouchedSteps([...touchedSteps, currentStep]);
    }
  }, [currentStep, touchedSteps]);

  // Handle form data changes
  const handleFormDataChange = (newData) => {
    setFormData({ ...formData, ...newData });
  };

  // Handle next step
  const handleNext = () => {
    // Validate current step before proceeding
    const currentStepComponent = steps[currentStep];
    const stepValidate = currentStepComponent.props.validate;
    
    if (stepValidate) {
      const stepErrors = stepValidate(formData);
      setFormErrors(stepErrors);
      
      // Only proceed if there are no errors
      if (Object.keys(stepErrors).length === 0) {
        goToNextStep();
      }
    } else {
      goToNextStep();
    }
  };

  // Go to next step without validation (internal use)
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate final step
    const finalStepComponent = steps[currentStep];
    const stepValidate = finalStepComponent.props.validate;
    
    if (stepValidate) {
      const stepErrors = stepValidate(formData);
      setFormErrors(stepErrors);
      
      // Only submit if there are no errors
      if (Object.keys(stepErrors).length === 0) {
        setIsSubmitting(true);
        try {
          await onSubmit(formData);
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle direct navigation to a specific step
  const goToStep = (stepIndex) => {
    // Only allow navigation to steps that have been touched or are the next step
    if (touchedSteps.includes(stepIndex) || stepIndex === currentStep + 1) {
      setCurrentStep(stepIndex);
      window.scrollTo(0, 0);
    }
  };

  // Render the current step with necessary props
  const renderCurrentStep = () => {
    const step = steps[currentStep];
    return React.cloneElement(step, {
      formData,
      onChange: handleFormDataChange,
      errors: formErrors,
      setErrors: setFormErrors,
      isSubmitting,
    });
  };

  return (
    <div className="multi-step-form">
      {/* Progress Bar */}
      {showProgressBar && (
        <div className="mb-8">
          <div className="relative pt-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <div className="flex justify-center mb-8">
        {steps.map((_, index) => (
          <div
            key={index}
            onClick={() => goToStep(index)}
            className={`w-8 h-8 mx-1 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200 ${
              index === currentStep
                ? 'bg-blue-600 text-white'
                : touchedSteps.includes(index)
                ? 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {touchedSteps.includes(index) && index < currentStep ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              index + 1
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {renderCurrentStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="secondary"
            onClick={currentStep === 0 ? onCancel : handlePrevious}
            disabled={isSubmitting}
          >
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </Button>

          <Button
            type={currentStep === steps.length - 1 ? 'submit' : 'button'}
            variant="primary"
            onClick={currentStep === steps.length - 1 ? undefined : handleNext}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {currentStep === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MultiStepForm;