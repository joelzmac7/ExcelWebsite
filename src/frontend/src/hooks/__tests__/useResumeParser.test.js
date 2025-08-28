import { renderHook, act } from '@testing-library/react-hooks';
import useResumeParser from '../useResumeParser';
import { parseResume } from '../../services/resume.service';

// Mock the resume service
jest.mock('../../services/resume.service', () => ({
  parseResume: jest.fn()
}));

describe('useResumeParser hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useResumeParser());

    expect(result.current.parsing).toBe(false);
    expect(result.current.parseError).toBeNull();
    expect(result.current.parsedData).toBeNull();
  });

  test('should handle successful resume parsing', async () => {
    // Mock successful response
    const mockParsedData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      specialty: 'ICU',
      yearsExperience: '5-10',
      licenses: [{ state: 'CA', licenseNumber: '12345', expirationDate: '2025-12-31' }],
      certifications: [{ name: 'BLS', issuingOrganization: 'AHA', expirationDate: '2024-06-30' }]
    };

    parseResume.mockResolvedValue({
      success: true,
      data: mockParsedData,
      message: 'Resume parsed successfully'
    });

    const mockFile = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });

    const { result, waitForNextUpdate } = renderHook(() => useResumeParser());

    // Call parseResumeFile
    let parsedResult;
    act(() => {
      parsedResult = result.current.parseResumeFile(mockFile);
    });

    // Should be in parsing state
    expect(result.current.parsing).toBe(true);
    expect(result.current.parseError).toBeNull();

    await waitForNextUpdate();

    // Should have completed parsing
    expect(result.current.parsing).toBe(false);
    expect(result.current.parseError).toBeNull();
    expect(result.current.parsedData).toEqual(mockParsedData);

    // The returned promise should resolve with the parsed data
    await expect(parsedResult).resolves.toEqual(mockParsedData);

    // Should have called parseResume with the file
    expect(parseResume).toHaveBeenCalledWith(mockFile);
  });

  test('should handle parsing error', async () => {
    // Mock error response
    parseResume.mockResolvedValue({
      success: false,
      message: 'Failed to parse resume'
    });

    const mockFile = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });

    const { result, waitForNextUpdate } = renderHook(() => useResumeParser());

    // Call parseResumeFile
    let parsedResult;
    act(() => {
      parsedResult = result.current.parseResumeFile(mockFile);
    });

    // Should be in parsing state
    expect(result.current.parsing).toBe(true);

    await waitForNextUpdate();

    // Should have completed parsing with error
    expect(result.current.parsing).toBe(false);
    expect(result.current.parseError).toBe('Failed to parse resume');
    expect(result.current.parsedData).toBeNull();

    // The returned promise should resolve with null
    await expect(parsedResult).resolves.toBeNull();
  });

  test('should handle API error', async () => {
    // Mock API error
    parseResume.mockRejectedValue(new Error('API error'));

    const mockFile = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });

    const { result, waitForNextUpdate } = renderHook(() => useResumeParser());

    // Call parseResumeFile
    let parsedResult;
    act(() => {
      parsedResult = result.current.parseResumeFile(mockFile);
    });

    // Should be in parsing state
    expect(result.current.parsing).toBe(true);

    await waitForNextUpdate();

    // Should have completed parsing with error
    expect(result.current.parsing).toBe(false);
    expect(result.current.parseError).toBe('API error');
    expect(result.current.parsedData).toBeNull();

    // The returned promise should resolve with null
    await expect(parsedResult).resolves.toBeNull();
  });

  test('should validate file type', async () => {
    const mockFile = new File(['dummy content'], 'resume.txt', { type: 'text/plain' });

    const { result } = renderHook(() => useResumeParser());

    // Call parseResumeFile with invalid file type
    let parsedResult;
    act(() => {
      parsedResult = result.current.parseResumeFile(mockFile);
    });

    // Should not be in parsing state
    expect(result.current.parsing).toBe(false);
    expect(result.current.parseError).toBe('Invalid file type. Please upload a PDF or Word document.');
    expect(result.current.parsedData).toBeNull();

    // The returned promise should resolve with null
    await expect(parsedResult).resolves.toBeNull();

    // Should not have called parseResume
    expect(parseResume).not.toHaveBeenCalled();
  });

  test('should validate file size', async () => {
    // Create a mock file that's too large (6MB)
    const mockFile = {
      name: 'large-resume.pdf',
      type: 'application/pdf',
      size: 6 * 1024 * 1024 // 6MB
    };

    const { result } = renderHook(() => useResumeParser());

    // Call parseResumeFile with file that's too large
    let parsedResult;
    act(() => {
      parsedResult = result.current.parseResumeFile(mockFile);
    });

    // Should not be in parsing state
    expect(result.current.parsing).toBe(false);
    expect(result.current.parseError).toBe('File size exceeds 5MB limit.');
    expect(result.current.parsedData).toBeNull();

    // The returned promise should resolve with null
    await expect(parsedResult).resolves.toBeNull();

    // Should not have called parseResume
    expect(parseResume).not.toHaveBeenCalled();
  });

  test('should handle null file input', async () => {
    const { result } = renderHook(() => useResumeParser());

    // Call parseResumeFile with null
    let parsedResult;
    act(() => {
      parsedResult = result.current.parseResumeFile(null);
    });

    // Should not be in parsing state
    expect(result.current.parsing).toBe(false);
    expect(result.current.parseError).toBe('No file provided');
    expect(result.current.parsedData).toBeNull();

    // The returned promise should resolve with null
    await expect(parsedResult).resolves.toBeNull();

    // Should not have called parseResume
    expect(parseResume).not.toHaveBeenCalled();
  });

  test('should pre-fill form data with parsed resume data', () => {
    const formData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialty: '',
      yearsExperience: '',
      licenses: [],
      certifications: [],
      resume: null
    };

    const resumeData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      specialty: 'ICU',
      yearsExperience: '5-10',
      licenses: [{ state: 'CA', licenseNumber: '12345', expirationDate: '2025-12-31' }],
      certifications: [{ name: 'BLS', issuingOrganization: 'AHA', expirationDate: '2024-06-30' }]
    };

    const { result } = renderHook(() => useResumeParser());

    // Call preFillFormData
    let updatedFormData;
    act(() => {
      updatedFormData = result.current.preFillFormData(formData, resumeData);
    });

    // Check that form data was updated with resume data
    expect(updatedFormData.firstName).toBe(resumeData.firstName);
    expect(updatedFormData.lastName).toBe(resumeData.lastName);
    expect(updatedFormData.email).toBe(resumeData.email);
    expect(updatedFormData.phone).toBe(resumeData.phone);
    expect(updatedFormData.specialty).toBe(resumeData.specialty);
    expect(updatedFormData.yearsExperience).toBe(resumeData.yearsExperience);
    expect(updatedFormData.licenses).toEqual(resumeData.licenses);
    expect(updatedFormData.certifications).toEqual(resumeData.certifications);
  });

  test('should reset parser state', () => {
    const { result } = renderHook(() => useResumeParser());

    // Set some state
    act(() => {
      result.current.parseError = 'Some error';
      result.current.parsedData = { firstName: 'John' };
      result.current.parsing = true;
    });

    // Call resetParser
    act(() => {
      result.current.resetParser();
    });

    // State should be reset
    expect(result.current.parsing).toBe(false);
    expect(result.current.parseError).toBeNull();
    expect(result.current.parsedData).toBeNull();
  });
});