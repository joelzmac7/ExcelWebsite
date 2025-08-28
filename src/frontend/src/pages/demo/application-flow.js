import React, { useState } from 'react';
import { EnhancedApplicationForm } from '../../components/Application';

const ApplicationFlowDemo = () => {
  // Mock job data
  const mockJob = {
    id: 'job-123',
    title: 'ICU Registered Nurse',
    facility: 'Memorial Hospital',
    location: 'San Francisco, CA',
    specialty: 'ICU',
    jobType: 'Travel',
    shift: 'Day Shift',
    startDate: '2025-09-15',
    duration: '13 weeks',
    weeklyPay: '$2,800',
    description: 'We are seeking an experienced ICU Registered Nurse for a 13-week travel assignment at our award-winning facility in San Francisco, CA. The ideal candidate will have at least 2 years of ICU experience and current CA license or compact license.',
  };

  // Handle form submission
  const handleSubmit = async (formData) => {
    // Simulate API call with a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Form submitted:', formData);
        resolve({
          id: 'app-' + Math.random().toString(36).substr(2, 9),
          jobId: mockJob.id,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          ...formData
        });
      }, 1500);
    });
  };

  // Handle cancel
  const handleCancel = () => {
    alert('Application cancelled');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">2-Click Application Flow Demo</h1>
          <p className="mt-2 text-gray-600">
            This demo showcases the streamlined application process for healthcare professionals.
          </p>
        </div>

        <EnhancedApplicationForm
          job={mockJob}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default ApplicationFlowDemo;