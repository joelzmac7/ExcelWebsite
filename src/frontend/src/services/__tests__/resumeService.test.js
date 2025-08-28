import axios from 'axios';
import { parseResume, mapResumeDataToFormFields, getJobRecommendationsFromResume } from '../resumeService';

// Mock axios
jest.mock('axios');

describe('Resume Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseResume', () => {
    test('should parse resume successfully', async () => {
      // Mock successful response
      const mockResponse = {
        data: {
          success: true,
          data: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '(555) 123-4567',
            specialty: 'ICU',
            yearsExperience: '5-10',
            licenses: [{ state: 'CA', licenseNumber: '12345', expirationDate: '2025-12-31' }],
            certifications: [{ name: 'BLS', issuingOrganization: 'AHA', expirationDate: '2024-06-30' }]
          },
          message: 'Resume parsed successfully'
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      // Create a mock file
      const mockFile = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });

      // Call the function
      const result = await parseResume(mockFile);

      // Check that axios was called correctly
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/resumes/parse'),
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      );

      // Check that the form data was created correctly
      const formDataArg = axios.post.mock.calls[0][1];
      expect(formDataArg.get('resume')).toBe(mockFile);

      // Check the result
      expect(result).toEqual(mockResponse.data);
    });

    test('should handle parsing error', async () => {
      // Mock error response
      const errorMessage = 'Failed to parse resume';
      axios.post.mockRejectedValue({
        response: {
          data: {
            message: errorMessage
          }
        }
      });

      // Create a mock file
      const mockFile = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });

      // Call the function and expect it to throw
      await expect(parseResume(mockFile)).rejects.toThrow(errorMessage);
    });

    test('should handle unexpected error', async () => {
      // Mock network error
      axios.post.mockRejectedValue(new Error('Network error'));

      // Create a mock file
      const mockFile = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });

      // Call the function and expect it to throw
      await expect(parseResume(mockFile)).rejects.toThrow('Network error');
    });
  });

  describe('mapResumeDataToFormFields', () => {
    test('should map resume data to form fields', () => {
      // Mock resume data
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

      // Call the function
      const result = mapResumeDataToFormFields(resumeData);

      // Check the result
      expect(result).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        specialty: 'ICU',
        yearsExperience: '5-10',
        licenses: resumeData.licenses,
        certifications: resumeData.certifications,
        coverLetter: '',
        availability: '',
        referralSource: '',
        agreeToTerms: false
      });
    });

    test('should handle null or undefined resume data', () => {
      // Call the function with null
      const result1 = mapResumeDataToFormFields(null);
      expect(result1).toEqual({});

      // Call the function with undefined
      const result2 = mapResumeDataToFormFields(undefined);
      expect(result2).toEqual({});
    });

    test('should handle partial resume data', () => {
      // Mock partial resume data
      const partialData = {
        firstName: 'John',
        email: 'john@example.com'
      };

      // Call the function
      const result = mapResumeDataToFormFields(partialData);

      // Check the result
      expect(result).toEqual({
        firstName: 'John',
        lastName: '',
        email: 'john@example.com',
        phone: '',
        specialty: '',
        yearsExperience: '',
        licenses: [],
        certifications: [],
        coverLetter: '',
        availability: '',
        referralSource: '',
        agreeToTerms: false
      });
    });
  });

  describe('getJobRecommendationsFromResume', () => {
    test('should get job recommendations from resume', async () => {
      // Mock successful parse response
      const mockParseResponse = {
        success: true,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          specialty: 'ICU',
          yearsExperience: '5-10'
        }
      };

      // Mock successful recommendations response
      const mockRecommendationsResponse = {
        data: {
          data: [
            {
              id: '1',
              title: 'ICU Nurse',
              facilityName: 'Memorial Hospital',
              city: 'San Francisco',
              state: 'CA',
              matchPercentage: 95
            },
            {
              id: '2',
              title: 'Critical Care Nurse',
              facilityName: 'City Hospital',
              city: 'Los Angeles',
              state: 'CA',
              matchPercentage: 85
            }
          ]
        }
      };

      // Setup mocks
      axios.post.mockImplementation((url) => {
        if (url.includes('/api/resumes/parse')) {
          return Promise.resolve({ data: mockParseResponse });
        } else if (url.includes('/api/matching/recommendations')) {
          return Promise.resolve(mockRecommendationsResponse);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      // Create a mock file
      const mockFile = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });

      // Call the function
      const result = await getJobRecommendationsFromResume(mockFile);

      // Check that axios was called correctly for both endpoints
      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(axios.post).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/api/resumes/parse'),
        expect.any(FormData),
        expect.any(Object)
      );
      expect(axios.post).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/api/matching/recommendations'),
        { candidate: mockParseResponse.data }
      );

      // Check the result
      expect(result).toEqual(mockRecommendationsResponse.data);
    });

    test('should handle parsing error', async () => {
      // Mock parse error
      axios.post.mockResolvedValue({
        data: {
          success: false,
          message: 'Failed to parse resume'
        }
      });

      // Create a mock file
      const mockFile = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });

      // Call the function and expect it to throw
      await expect(getJobRecommendationsFromResume(mockFile)).rejects.toThrow('Failed to parse resume');
    });

    test('should handle recommendations error', async () => {
      // Mock successful parse response
      axios.post.mockImplementationOnce(() => 
        Promise.resolve({
          data: {
            success: true,
            data: {
              firstName: 'John',
              lastName: 'Doe'
            }
          }
        })
      );

      // Mock recommendations error
      axios.post.mockImplementationOnce(() => 
        Promise.reject(new Error('Failed to get recommendations'))
      );

      // Create a mock file
      const mockFile = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });

      // Call the function and expect it to throw
      await expect(getJobRecommendationsFromResume(mockFile)).rejects.toThrow('Failed to get recommendations');
    });
  });
});