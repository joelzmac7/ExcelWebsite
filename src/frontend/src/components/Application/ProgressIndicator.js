import React from 'react';

/**
 * ProgressIndicator Component
 * 
 * A component that displays the user's progress through a multi-step process
 * 
 * @param {Object} props - Component props
 * @param {number} props.currentStep - Current step index (0-based)
 * @param {number} props.totalSteps - Total number of steps
 * @param {string[]} props.stepLabels - Optional labels for each step
 * @param {boolean[]} props.completedSteps - Array indicating which steps are completed
 * @param {Function} props.onStepClick - Function called when a step is clicked
 * @param {boolean} props.allowNavigation - Whether to allow navigation by clicking on steps
 */
const ProgressIndicator = ({
  currentStep,
  totalSteps,
  stepLabels = [],
  completedSteps = [],
  onStepClick,
  allowNavigation = true
}) => {
  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  // Handle step click
  const handleStepClick = (index) => {
    if (allowNavigation && onStepClick) {
      // Only allow clicking on completed steps or the current step + 1
      if (completedSteps[index] || index === currentStep || index === currentStep + 1) {
        onStepClick(index);
      }
    }
  };

  return (
    <div className="progress-indicator">
      {/* Linear Progress Bar */}
      <div className="relative pt-1 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-blue-600">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
          <div
            style={{ width: `${progressPercentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
          ></div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex flex-wrap justify-center mb-8">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = completedSteps[index];
          const isCurrent = index === currentStep;
          const isClickable = allowNavigation && (isCompleted || index === currentStep || index === currentStep + 1);
          
          return (
            <div key={index} className="step-indicator-container flex flex-col items-center mx-2 mb-4">
              <div
                onClick={() => handleStepClick(index)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                } ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
              >
                {isCompleted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
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
              {stepLabels[index] && (
                <span className={`text-xs mt-2 font-medium ${
                  isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-500' : 'text-gray-500'
                }`}>
                  {stepLabels[index]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Connecting Lines */}
      <div className="hidden md:block absolute top-0 left-0 right-0 h-full pointer-events-none">
        <div className="flex justify-between items-center h-full">
          {Array.from({ length: totalSteps - 1 }).map((_, index) => (
            <div
              key={index}
              className={`h-0.5 flex-1 mx-2 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;