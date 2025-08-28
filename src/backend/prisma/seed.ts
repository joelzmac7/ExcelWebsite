import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create specialties
  const specialties = [
    {
      name: 'Registered Nurse (RN)',
      category: 'Nursing',
      description: 'Registered nurses provide and coordinate patient care, educate patients about health conditions, and provide advice and emotional support.',
      requiredCertifications: ['RN License', 'BLS'],
      averagePayRate: 45.0,
      demandLevel: 5,
    },
    {
      name: 'Critical Care RN',
      category: 'Nursing',
      description: 'Critical care nurses provide direct patient care to those who are critically ill or injured.',
      requiredCertifications: ['RN License', 'BLS', 'ACLS', 'PALS'],
      averagePayRate: 52.0,
      demandLevel: 5,
    },
    {
      name: 'Emergency Room RN',
      category: 'Nursing',
      description: 'Emergency room nurses provide rapid assessment and care to patients in emergency situations.',
      requiredCertifications: ['RN License', 'BLS', 'ACLS', 'PALS', 'TNCC'],
      averagePayRate: 50.0,
      demandLevel: 5,
    },
    {
      name: 'Medical-Surgical RN',
      category: 'Nursing',
      description: 'Medical-surgical nurses provide care for adult patients with medical conditions or recovering from surgery.',
      requiredCertifications: ['RN License', 'BLS'],
      averagePayRate: 42.0,
      demandLevel: 4,
    },
    {
      name: 'Labor & Delivery RN',
      category: 'Nursing',
      description: 'Labor and delivery nurses provide care to women during labor and childbirth.',
      requiredCertifications: ['RN License', 'BLS', 'NRP'],
      averagePayRate: 48.0,
      demandLevel: 4,
    },
  ];

  for (const specialty of specialties) {
    await prisma.specialty.upsert({
      where: { name: specialty.name },
      update: specialty,
      create: specialty,
    });
  }
  console.log(`Created ${specialties.length} specialties`);

  // Create cities
  const cities = [
    {
      name: 'Los Angeles',
      state: 'CA',
      stateName: 'California',
      zipCodes: ['90001', '90002', '90003', '90004', '90005'],
      latitude: 34.0522,
      longitude: -118.2437,
      population: 3979576,
      costOfLivingIndex: 173.3,
      housingCostIndex: 298.2,
      healthcareFacilitiesCount: 85,
      topEmployers: ['Cedars-Sinai Medical Center', 'UCLA Health', 'Kaiser Permanente'],
      climateDescription: 'Mediterranean climate with mild, somewhat wet winters and warm, sunny summers.',
      publicTransportRating: 6,
      walkabilityScore: 69,
      crimeRateIndex: 29.1,
      hasCityGuide: true,
    },
    {
      name: 'New York',
      state: 'NY',
      stateName: 'New York',
      zipCodes: ['10001', '10002', '10003', '10004', '10005'],
      latitude: 40.7128,
      longitude: -74.0060,
      population: 8336817,
      costOfLivingIndex: 187.2,
      housingCostIndex: 318.6,
      healthcareFacilitiesCount: 111,
      topEmployers: ['NewYork-Presbyterian Hospital', 'Mount Sinai Health System', 'NYU Langone Health'],
      climateDescription: 'Humid subtropical climate with cold winters and hot, humid summers.',
      publicTransportRating: 9,
      walkabilityScore: 88,
      crimeRateIndex: 24.9,
      hasCityGuide: true,
    },
    {
      name: 'Chicago',
      state: 'IL',
      stateName: 'Illinois',
      zipCodes: ['60601', '60602', '60603', '60604', '60605'],
      latitude: 41.8781,
      longitude: -87.6298,
      population: 2693976,
      costOfLivingIndex: 106.9,
      housingCostIndex: 151.7,
      healthcareFacilitiesCount: 67,
      topEmployers: ['Northwestern Memorial Hospital', 'University of Chicago Medical Center', 'Rush University Medical Center'],
      climateDescription: 'Humid continental climate with cold winters and warm to hot summers.',
      publicTransportRating: 8,
      walkabilityScore: 77,
      crimeRateIndex: 35.6,
      hasCityGuide: true,
    },
    {
      name: 'Houston',
      state: 'TX',
      stateName: 'Texas',
      zipCodes: ['77001', '77002', '77003', '77004', '77005'],
      latitude: 29.7604,
      longitude: -95.3698,
      population: 2320268,
      costOfLivingIndex: 96.5,
      housingCostIndex: 89.3,
      healthcareFacilitiesCount: 85,
      topEmployers: ['Texas Medical Center', 'Houston Methodist Hospital', 'Memorial Hermann Health System'],
      climateDescription: 'Humid subtropical climate with hot summers and mild winters.',
      publicTransportRating: 4,
      walkabilityScore: 48,
      crimeRateIndex: 30.2,
      hasCityGuide: true,
    },
    {
      name: 'Phoenix',
      state: 'AZ',
      stateName: 'Arizona',
      zipCodes: ['85001', '85002', '85003', '85004', '85005'],
      latitude: 33.4484,
      longitude: -112.0740,
      population: 1680992,
      costOfLivingIndex: 103.7,
      housingCostIndex: 107.1,
      healthcareFacilitiesCount: 56,
      topEmployers: ['Banner Health', 'Mayo Clinic', 'Dignity Health'],
      climateDescription: 'Hot desert climate with extremely hot summers and mild winters.',
      publicTransportRating: 3,
      walkabilityScore: 41,
      crimeRateIndex: 29.8,
      hasCityGuide: true,
    },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { name_state: { name: city.name, state: city.state } },
      update: city,
      create: city,
    });
  }
  console.log(`Created ${cities.length} cities`);

  // Create facilities
  const facilities = [
    {
      externalId: 'FAC001',
      name: 'Cedars-Sinai Medical Center',
      type: 'Hospital',
      address: '8700 Beverly Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90048',
      latitude: 34.0746,
      longitude: -118.3801,
      phone: '310-423-3277',
      website: 'https://www.cedars-sinai.org',
      description: 'Cedars-Sinai is a nonprofit academic healthcare organization serving the diverse Los Angeles community and beyond.',
      bedCount: 886,
      traumaLevel: 'Level I',
      specialties: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics'],
      rating: 4.8,
      isTeachingHospital: true,
      isMagnetDesignated: true,
    },
    {
      externalId: 'FAC002',
      name: 'NewYork-Presbyterian Hospital',
      type: 'Hospital',
      address: '525 E 68th St',
      city: 'New York',
      state: 'NY',
      zipCode: '10065',
      latitude: 40.7649,
      longitude: -73.9552,
      phone: '212-746-5454',
      website: 'https://www.nyp.org',
      description: 'NewYork-Presbyterian is one of the nation\'s most comprehensive, integrated academic health care delivery systems.',
      bedCount: 2600,
      traumaLevel: 'Level I',
      specialties: ['Cardiology', 'Neurology', 'Oncology', 'Transplant'],
      rating: 4.7,
      isTeachingHospital: true,
      isMagnetDesignated: true,
    },
    {
      externalId: 'FAC003',
      name: 'Northwestern Memorial Hospital',
      type: 'Hospital',
      address: '251 E Huron St',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60611',
      latitude: 41.8947,
      longitude: -87.6205,
      phone: '312-926-2000',
      website: 'https://www.nm.org',
      description: 'Northwestern Memorial Hospital is an academic medical center in the heart of downtown Chicago.',
      bedCount: 894,
      traumaLevel: 'Level I',
      specialties: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics'],
      rating: 4.6,
      isTeachingHospital: true,
      isMagnetDesignated: true,
    },
    {
      externalId: 'FAC004',
      name: 'Houston Methodist Hospital',
      type: 'Hospital',
      address: '6565 Fannin St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77030',
      latitude: 29.7098,
      longitude: -95.4018,
      phone: '713-790-3311',
      website: 'https://www.houstonmethodist.org',
      description: 'Houston Methodist Hospital is a leading academic medical center in the Texas Medical Center.',
      bedCount: 907,
      traumaLevel: 'Level III',
      specialties: ['Cardiology', 'Neurology', 'Oncology', 'Transplant'],
      rating: 4.5,
      isTeachingHospital: true,
      isMagnetDesignated: true,
    },
    {
      externalId: 'FAC005',
      name: 'Mayo Clinic Hospital',
      type: 'Hospital',
      address: '5777 E Mayo Blvd',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85054',
      latitude: 33.6562,
      longitude: -111.9560,
      phone: '480-342-2000',
      website: 'https://www.mayoclinic.org',
      description: 'Mayo Clinic Hospital in Phoenix is a 268-bed, seven-story facility with state-of-the-art medical technology.',
      bedCount: 268,
      traumaLevel: 'Level I',
      specialties: ['Cardiology', 'Neurology', 'Oncology', 'Transplant'],
      rating: 4.9,
      isTeachingHospital: true,
      isMagnetDesignated: true,
    },
  ];

  for (const facility of facilities) {
    await prisma.facility.upsert({
      where: { externalId: facility.externalId },
      update: facility,
      create: facility,
    });
  }
  console.log(`Created ${facilities.length} facilities`);

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const recruiterPassword = await bcrypt.hash('recruiter123', 10);
  const candidatePassword = await bcrypt.hash('candidate123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@excelmedicalsolutions.com' },
    update: {
      passwordHash: adminPassword,
    },
    create: {
      email: 'admin@excelmedicalsolutions.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      phone: '555-123-4567',
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@excelmedicalsolutions.com' },
    update: {
      passwordHash: recruiterPassword,
    },
    create: {
      email: 'recruiter@excelmedicalsolutions.com',
      passwordHash: recruiterPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'recruiter',
      phone: '555-987-6543',
      specialty: 'Nursing',
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: 'nurse@example.com' },
    update: {
      passwordHash: candidatePassword,
    },
    create: {
      email: 'nurse@example.com',
      passwordHash: candidatePassword,
      firstName: 'Michael',
      lastName: 'Williams',
      role: 'candidate',
      phone: '555-456-7890',
      specialty: 'Registered Nurse (RN)',
      yearsExperience: 5,
      preferredStates: ['CA', 'NY', 'TX'],
      preferredCities: ['Los Angeles', 'New York', 'Houston'],
      preferredPayRangeMin: 45.0,
      preferredPayRangeMax: 65.0,
      preferredShiftType: 'Day',
      licenseStates: ['CA', 'NY', 'TX'],
      profileCompletionPercentage: 85,
    },
  });

  console.log(`Created users: admin, recruiter, candidate`);

  // Create jobs
  const jobs = [
    {
      externalId: 'JOB001',
      title: 'ICU Registered Nurse',
      specialty: 'Critical Care RN',
      facilityName: 'Cedars-Sinai Medical Center',
      facilityId: (await prisma.facility.findUnique({ where: { externalId: 'FAC001' } }))?.id,
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90048',
      latitude: 34.0746,
      longitude: -118.3801,
      startDate: new Date('2025-10-01'),
      endDate: new Date('2026-01-01'),
      weeklyHours: 36,
      shiftDetails: '3x12 - Day Shift (7AM-7PM)',
      shiftType: 'Day',
      payRate: 55.0,
      housingStipend: 1200.0,
      requirements: 'Active CA RN license, BLS, ACLS, 2+ years ICU experience, COVID-19 vaccination',
      benefits: 'Medical, dental, vision insurance, 401(k) matching, travel reimbursement',
      description: 'Join our award-winning ICU team at Cedars-Sinai Medical Center. We are seeking experienced ICU nurses for a 13-week assignment with possible extension.',
      status: 'active',
      isFeatured: true,
      isUrgent: true,
      recruiterId: recruiter.id,
      seoTitle: 'ICU RN Travel Nurse Job in Los Angeles, CA | Cedars-Sinai',
      seoDescription: 'Apply for this high-paying ICU RN travel nurse position at Cedars-Sinai Medical Center in Los Angeles, CA. 13-week assignment with great benefits.',
      seoKeywords: ['ICU RN', 'Travel Nurse', 'Los Angeles', 'Cedars-Sinai', 'Critical Care'],
    },
    {
      externalId: 'JOB002',
      title: 'Emergency Room RN',
      specialty: 'Emergency Room RN',
      facilityName: 'NewYork-Presbyterian Hospital',
      facilityId: (await prisma.facility.findUnique({ where: { externalId: 'FAC002' } }))?.id,
      city: 'New York',
      state: 'NY',
      zipCode: '10065',
      latitude: 40.7649,
      longitude: -73.9552,
      startDate: new Date('2025-09-15'),
      endDate: new Date('2025-12-15'),
      weeklyHours: 36,
      shiftDetails: '3x12 - Night Shift (7PM-7AM)',
      shiftType: 'Night',
      payRate: 60.0,
      housingStipend: 1500.0,
      requirements: 'Active NY RN license, BLS, ACLS, PALS, TNCC, 2+ years ER experience, COVID-19 vaccination',
      benefits: 'Medical, dental, vision insurance, 401(k) matching, travel reimbursement',
      description: 'Join our Level I Trauma Center at NewYork-Presbyterian Hospital. We are seeking experienced ER nurses for a 13-week assignment with possible extension.',
      status: 'active',
      isFeatured: true,
      isUrgent: false,
      recruiterId: recruiter.id,
      seoTitle: 'ER RN Travel Nurse Job in New York, NY | NewYork-Presbyterian',
      seoDescription: 'Apply for this high-paying ER RN travel nurse position at NewYork-Presbyterian Hospital in New York, NY. 13-week assignment with great benefits.',
      seoKeywords: ['ER RN', 'Travel Nurse', 'New York', 'NewYork-Presbyterian', 'Emergency Room'],
    },
    {
      externalId: 'JOB003',
      title: 'Medical-Surgical RN',
      specialty: 'Medical-Surgical RN',
      facilityName: 'Northwestern Memorial Hospital',
      facilityId: (await prisma.facility.findUnique({ where: { externalId: 'FAC003' } }))?.id,
      city: 'Chicago',
      state: 'IL',
      zipCode: '60611',
      latitude: 41.8947,
      longitude: -87.6205,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-01'),
      weeklyHours: 36,
      shiftDetails: '3x12 - Day Shift (7AM-7PM)',
      shiftType: 'Day',
      payRate: 45.0,
      housingStipend: 1100.0,
      requirements: 'Active IL RN license, BLS, 1+ year Med-Surg experience, COVID-19 vaccination',
      benefits: 'Medical, dental, vision insurance, 401(k) matching, travel reimbursement',
      description: 'Join our Medical-Surgical unit at Northwestern Memorial Hospital. We are seeking experienced Med-Surg nurses for a 13-week assignment with possible extension.',
      status: 'active',
      isFeatured: false,
      isUrgent: false,
      recruiterId: recruiter.id,
      seoTitle: 'Med-Surg RN Travel Nurse Job in Chicago, IL | Northwestern Memorial',
      seoDescription: 'Apply for this Med-Surg RN travel nurse position at Northwestern Memorial Hospital in Chicago, IL. 13-week assignment with great benefits.',
      seoKeywords: ['Med-Surg RN', 'Travel Nurse', 'Chicago', 'Northwestern Memorial', 'Medical-Surgical'],
    },
    {
      externalId: 'JOB004',
      title: 'Labor & Delivery RN',
      specialty: 'Labor & Delivery RN',
      facilityName: 'Houston Methodist Hospital',
      facilityId: (await prisma.facility.findUnique({ where: { externalId: 'FAC004' } }))?.id,
      city: 'Houston',
      state: 'TX',
      zipCode: '77030',
      latitude: 29.7098,
      longitude: -95.4018,
      startDate: new Date('2025-10-15'),
      endDate: new Date('2026-01-15'),
      weeklyHours: 36,
      shiftDetails: '3x12 - Night Shift (7PM-7AM)',
      shiftType: 'Night',
      payRate: 50.0,
      housingStipend: 1000.0,
      requirements: 'Active TX RN license, BLS, NRP, 2+ years L&D experience, COVID-19 vaccination',
      benefits: 'Medical, dental, vision insurance, 401(k) matching, travel reimbursement',
      description: 'Join our Labor & Delivery unit at Houston Methodist Hospital. We are seeking experienced L&D nurses for a 13-week assignment with possible extension.',
      status: 'active',
      isFeatured: false,
      isUrgent: true,
      recruiterId: recruiter.id,
      seoTitle: 'L&D RN Travel Nurse Job in Houston, TX | Houston Methodist',
      seoDescription: 'Apply for this Labor & Delivery RN travel nurse position at Houston Methodist Hospital in Houston, TX. 13-week assignment with great benefits.',
      seoKeywords: ['L&D RN', 'Travel Nurse', 'Houston', 'Houston Methodist', 'Labor & Delivery'],
    },
    {
      externalId: 'JOB005',
      title: 'Telemetry RN',
      specialty: 'Medical-Surgical RN',
      facilityName: 'Mayo Clinic Hospital',
      facilityId: (await prisma.facility.findUnique({ where: { externalId: 'FAC005' } }))?.id,
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85054',
      latitude: 33.6562,
      longitude: -111.9560,
      startDate: new Date('2025-09-15'),
      endDate: new Date('2025-12-15'),
      weeklyHours: 36,
      shiftDetails: '3x12 - Day/Night Rotation',
      shiftType: 'Rotating',
      payRate: 48.0,
      housingStipend: 1100.0,
      requirements: 'Active AZ RN license, BLS, ACLS, 1+ year Telemetry experience, COVID-19 vaccination',
      benefits: 'Medical, dental, vision insurance, 401(k) matching, travel reimbursement',
      description: 'Join our Telemetry unit at Mayo Clinic Hospital. We are seeking experienced Telemetry nurses for a 13-week assignment with possible extension.',
      status: 'active',
      isFeatured: false,
      isUrgent: false,
      recruiterId: recruiter.id,
      seoTitle: 'Telemetry RN Travel Nurse Job in Phoenix, AZ | Mayo Clinic',
      seoDescription: 'Apply for this Telemetry RN travel nurse position at Mayo Clinic Hospital in Phoenix, AZ. 13-week assignment with great benefits.',
      seoKeywords: ['Telemetry RN', 'Travel Nurse', 'Phoenix', 'Mayo Clinic', 'Cardiac'],
    },
  ];

  for (const job of jobs) {
    await prisma.job.upsert({
      where: { externalId: job.externalId },
      update: job,
      create: job,
    });
  }
  console.log(`Created ${jobs.length} jobs`);

  // Create applications
  const jobEntities = await prisma.job.findMany({
    where: {
      externalId: {
        in: ['JOB001', 'JOB002']
      }
    }
  });

  if (jobEntities.length > 0) {
    const applications = [
      {
        jobId: jobEntities[0].id,
        candidateId: candidate.id,
        status: 'submitted',
        applicationDate: new Date('2025-08-15'),
        lastStatusChange: new Date('2025-08-15'),
        candidateNotes: 'I am very interested in this position and have 3 years of ICU experience.',
        source: 'direct',
        matchScore: 85.5,
      }
    ];

    for (const application of applications) {
      await prisma.application.create({
        data: application,
      });
    }
    console.log(`Created ${applications.length} applications`);
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });