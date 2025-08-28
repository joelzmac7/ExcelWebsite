import { renderHook, act } from '@testing-library/react-hooks';
import useFormValidation from '../useFormValidation';

describe('useFormValidation hook', () => {
  const initialFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    agreeToTerms: false
  };

  const validationRules = {
    firstName: { 
      required: true, 
      requiredMessage: 'First name is required' 
    },
    lastName: { 
      required: true, 
      requiredMessage: 'Last name is required' 
    },
    email: { 
      required: true, 
      requiredMessage: 'Email is required',
      isEmail: true,
      emailMessage: 'Please enter a valid email address'
    },
    phone: { 
      required: true, 
      requiredMessage: 'Phone number is required',
      isPhone: true,
      phoneMessage: 'Please enter a valid phone number'
    },
    agreeToTerms: { 
      custom: (value) => !value ? 'You must agree to the terms and conditions' : ''
    }
  };

  test('should initialize with no errors and isValid=false', () => {
    const { result } = renderHook(() => useFormValidation(initialFormData, validationRules));

    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(false);
    expect(result.current.touchedFields).toEqual({});
  });

  test('should validate required fields', () => {
    const { result } = renderHook(() => useFormValidation(initialFormData, validationRules));

    // Validate the form
    act(() => {
      result.current.validateForm();
    });

    // Should have errors for all required fields
    expect(result.current.errors.firstName).toBe('First name is required');
    expect(result.current.errors.lastName).toBe('Last name is required');
    expect(result.current.errors.email).toBe('Email is required');
    expect(result.current.errors.phone).toBe('Phone number is required');
    expect(result.current.errors.agreeToTerms).toBe('You must agree to the terms and conditions');
    expect(result.current.isValid).toBe(false);
  });

  test('should validate email format', () => {
    const formData = {
      ...initialFormData,
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      phone: '1234567890',
      agreeToTerms: true
    };

    const { result } = renderHook(() => useFormValidation(formData, validationRules));

    // Validate the form
    act(() => {
      result.current.validateForm();
    });

    // Should have error for invalid email
    expect(result.current.errors.email).toBe('Please enter a valid email address');
    expect(result.current.isValid).toBe(false);
  });

  test('should validate phone format', () => {
    const formData = {
      ...initialFormData,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: 'invalid-phone',
      agreeToTerms: true
    };

    const { result } = renderHook(() => useFormValidation(formData, validationRules));

    // Validate the form
    act(() => {
      result.current.validateForm();
    });

    // Should have error for invalid phone
    expect(result.current.errors.phone).toBe('Please enter a valid phone number');
    expect(result.current.isValid).toBe(false);
  });

  test('should mark fields as touched', () => {
    const { result } = renderHook(() => useFormValidation(initialFormData, validationRules));

    // Touch a field
    act(() => {
      result.current.touchField('firstName');
    });

    expect(result.current.touchedFields.firstName).toBe(true);
  });

  test('should validate a single field', () => {
    const { result } = renderHook(() => useFormValidation(initialFormData, validationRules));

    // Validate a single field
    let error;
    act(() => {
      error = result.current.validateField('firstName', '');
    });

    expect(error).toBe('First name is required');

    act(() => {
      error = result.current.validateField('firstName', 'John');
    });

    expect(error).toBe('');
  });

  test('should validate form with valid data', () => {
    const validFormData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      agreeToTerms: true
    };

    const { result } = renderHook(() => useFormValidation(validFormData, validationRules));

    // Validate the form
    let isValid;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(true);
  });

  test('should revalidate when form data changes', () => {
    const { result, rerender } = renderHook(
      ({ formData }) => useFormValidation(formData, validationRules),
      { initialProps: { formData: initialFormData } }
    );

    // Initially should have errors (but they're not in the errors object yet because no validation has run)
    expect(result.current.isValid).toBe(false);

    // Update form data to valid values
    const validFormData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      agreeToTerms: true
    };

    rerender({ formData: validFormData });

    // Should now be valid
    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  test('should handle custom validation rules', () => {
    const customRules = {
      password: {
        custom: (value, formData) => {
          if (value.length < 8) {
            return 'Password must be at least 8 characters';
          }
          if (!/[A-Z]/.test(value)) {
            return 'Password must contain at least one uppercase letter';
          }
          if (!/[0-9]/.test(value)) {
            return 'Password must contain at least one number';
          }
          return '';
        }
      },
      confirmPassword: {
        custom: (value, formData) => {
          if (value !== formData.password) {
            return 'Passwords do not match';
          }
          return '';
        }
      }
    };

    const passwordFormData = {
      password: 'weak',
      confirmPassword: 'different'
    };

    const { result } = renderHook(() => useFormValidation(passwordFormData, customRules));

    // Validate the form
    act(() => {
      result.current.validateForm();
    });

    expect(result.current.errors.password).toBe('Password must be at least 8 characters');
    expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
    expect(result.current.isValid).toBe(false);

    // Update to valid password but still mismatched
    const updatedFormData = {
      password: 'StrongPassword123',
      confirmPassword: 'different'
    };

    const { result: updatedResult } = renderHook(() => 
      useFormValidation(updatedFormData, customRules)
    );

    act(() => {
      updatedResult.current.validateForm();
    });

    expect(updatedResult.current.errors.password).toBe('');
    expect(updatedResult.current.errors.confirmPassword).toBe('Passwords do not match');
    expect(updatedResult.current.isValid).toBe(false);

    // Finally make them match
    const matchingFormData = {
      password: 'StrongPassword123',
      confirmPassword: 'StrongPassword123'
    };

    const { result: matchingResult } = renderHook(() => 
      useFormValidation(matchingFormData, customRules)
    );

    act(() => {
      matchingResult.current.validateForm();
    });

    expect(matchingResult.current.errors.password).toBe('');
    expect(matchingResult.current.errors.confirmPassword).toBe('');
    expect(matchingResult.current.isValid).toBe(true);
  });
});