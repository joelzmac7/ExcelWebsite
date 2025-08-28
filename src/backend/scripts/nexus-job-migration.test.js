/**
 * Tests for Nexus Job Data Migration Utility
 */

const { transformJobData } = require('./nexus-job-migration');

describe('Nexus Job Migration Utility', () => {
  describe('transformJobData', () => {
    test('transforms complete job data correctly', () => {
      const nexusJob = {
        id: '12345',
        title: 'ICU Registered Nurse',
        specialty: 'ICU',
        facility_name: 'Memorial Hospital',
        facility_id: 'facility-123',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94107',
        coordinates: {
          latitude: '37.7749',
          longitude: '-122.4194'
        },
        start_date: '2025-10-01',
        end_date: '2026-01-01',
        weekly_hours: '36',
        shift_details: '3x12 Night Shift',
        pay_rate: '2500',
        housing_stipend: '1000',
        requirements: 'BLS, ACLS, 2 years ICU experience',
        benefits: 'Health insurance, 401k',
        description: 'Join our team of dedicated nurses',
        status: 'active'
      };

      const transformed = transformJobData(nexusJob);

      expect(transformed).toEqual(expect.objectContaining({
        externalId: '12345',
        title: 'ICU Registered Nurse',
        specialty: 'ICU',
        facilityName: 'Memorial Hospital',
        facilityId: 'facility-123',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94107',
        latitude: 37.7749,
        longitude: -122.4194,
        weeklyHours: 36,
        shiftDetails: '3x12 Night Shift',
        shiftType: 'Night',
        payRate: 2500,
        housingStipend: 1000,
        requirements: 'BLS, ACLS, 2 years ICU experience',
        benefits: 'Health insurance, 401k',
        description: 'Join our team of dedicated nurses',
        status: 'active'
      }));

      expect(transformed.startDate).toBeInstanceOf(Date);
      expect(transformed.endDate).toBeInstanceOf(Date);
      expect(transformed.seoTitle).toContain('ICU Registered Nurse in San Francisco, CA');
      expect(transformed.seoDescription).toContain('ICU Registered Nurse position at Memorial Hospital');
      expect(transformed.seoKeywords).toContain('ICU San Francisco');
    });

    test('handles missing fields gracefully', () => {
      const nexusJob = {
        id: '12345',
        title: 'ICU Registered Nurse',
        specialty: 'ICU',
        city: 'San Francisco',
        state: 'CA',
        pay_rate: '2500',
        status: 'active'
      };

      const transformed = transformJobData(nexusJob);

      expect(transformed).toEqual(expect.objectContaining({
        externalId: '12345',
        title: 'ICU Registered Nurse',
        specialty: 'ICU',
        facilityName: '',
        city: 'San Francisco',
        state: 'CA',
        payRate: 2500,
        weeklyHours: 36, // Default value
        shiftDetails: '',
        shiftType: null,
        requirements: '',
        benefits: '',
        description: '',
        status: 'active'
      }));
    });

    test('calculates weekly hours from shift details', () => {
      const nexusJob = {
        id: '12345',
        title: 'ICU Registered Nurse',
        shift_details: '4x10 Day Shift',
        status: 'active'
      };

      const transformed = transformJobData(nexusJob);

      expect(transformed.weeklyHours).toBe(40); // 4 shifts x 10 hours
      expect(transformed.shiftType).toBe('Day');
    });

    test('determines urgency based on start date', () => {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const nexusJob = {
        id: '12345',
        title: 'ICU Registered Nurse',
        start_date: nextWeek.toISOString(),
        status: 'active'
      };

      const transformed = transformJobData(nexusJob);

      expect(transformed.isUrgent).toBe(true);
    });

    test('maps status correctly', () => {
      expect(transformJobData({ id: '1', status: 'active' }).status).toBe('active');
      expect(transformJobData({ id: '2', status: 'open' }).status).toBe('active');
      expect(transformJobData({ id: '3', status: 'filled' }).status).toBe('filled');
      expect(transformJobData({ id: '4', status: 'closed' }).status).toBe('filled');
      expect(transformJobData({ id: '5', status: 'expired' }).status).toBe('expired');
      expect(transformJobData({ id: '6', status: 'draft' }).status).toBe('draft');
      expect(transformJobData({ id: '7', status: 'pending' }).status).toBe('draft');
      expect(transformJobData({ id: '8', status: 'unknown' }).status).toBe('active'); // Default
    });
  });
});