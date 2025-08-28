/**
 * Unit tests for the resume parser service
 */
const { parseResume } = require('../index');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Mock the exec function
jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: jest.fn((fn) => {
    if (fn.name === 'exec') {
      return jest.fn().mockImplementation((command) => {
        if (command.includes('pdftotext')) {
          return Promise.resolve({
            stdout: 'John Smith\njsmith@example.com\n(555) 123-4567\n\nSummary\nExperienced ICU nurse with 5+ years in critical care settings.\n\nExperience\nMemorial Hospital - ICU Nurse\n2018-2023\n\nEducation\nBSN, University of Healthcare, 2018\n\nCertifications\nBLS, ACLS, PALS\n\nLicenses\nRN License - CA - RN12345678 - Expires: 2025-12-31',
          });
        } else if (command.includes('antiword') || command.includes('catdoc')) {
          return Promise.resolve({
            stdout: 'Jane Doe\njdoe@example.com\n(555) 987-6543\n\nSummary\nDedicated Emergency Room nurse with 3+ years experience.\n\nExperience\nCity Hospital - ER Nurse\n2020-2023\n\nEducation\nBSN, Medical University, 2020\n\nCertifications\nBLS, ACLS, TNCC\n\nLicenses\nRN License - NY - RN98765432 - Expires: 2024-06-30',
          });
        }
        return Promise.reject(new Error('Command not supported in mock'));
      });
    }
    return fn;
  }),
}));

// Mock the NER class
jest.mock('@nlpjs/ner', () => {
  return {
    NER: jest.fn().mockImplementation(() => {
      return {
        addNamedEntityText: jest.fn(),
        process: jest.fn().mockResolvedValue({
          entities: [
            { entity: 'SPECIALTY', sourceText: 'ICU' },
            { entity: 'CERTIFICATION', sourceText: 'BLS' },
            { entity: 'CERTIFICATION', sourceText: 'ACLS' }
          ]
        })
      };
    })
  };
});

describe('Resume Parser', () => {
  let tempFilePath;
  
  beforeEach(async () => {
    // Create a temporary file for testing
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, 'test-resume.pdf');
    await fs.writeFile(tempFilePath, 'Test resume content');
  });
  
  afterEach(async () => {
    // Clean up temporary file
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      // Ignore errors if file doesn't exist
    }
  });
  
  test('should parse PDF resume correctly', async () => {
    const result = await parseResume(tempFilePath);
    
    // Check that basic contact info was extracted
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Smith');
    expect(result.email).toBe('jsmith@example.com');
    expect(result.phone).toBe('(555) 123-4567');
    
    // Check that specialty was extracted
    expect(result.specialty).toBe('ICU');
    
    // Check that years of experience was calculated
    expect(result.yearsExperience).toBe('2-5');
    
    // Check that certifications were extracted
    expect(result.certifications).toHaveLength(2);
    expect(result.certifications[0].name).toBe('BLS');
    expect(result.certifications[1].name).toBe('ACLS');
    
    // Check that licenses were extracted
    expect(result.licenses).toHaveLength(1);
    expect(result.licenses[0].state).toBe('CA');
    expect(result.licenses[0].licenseNumber).toBe('RN12345678');
  });
  
  test('should handle errors gracefully', async () => {
    // Mock fs.promises.readFile to throw an error
    jest.spyOn(fs.promises, 'readFile').mockRejectedValueOnce(new Error('File not found'));
    
    await expect(parseResume('nonexistent-file.txt')).rejects.toThrow('Failed to parse resume');
  });
  
  test('should reject unsupported file formats', async () => {
    await expect(parseResume('resume.xyz')).rejects.toThrow('Unsupported file format');
  });
});