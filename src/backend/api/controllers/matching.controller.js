/**
 * Matching Controller
 * 
 * Handles job matching and recommendations
 */

const { findMatchingJobs, findMatchingCandidates } = require('../../../ai/job-matcher');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get job recommendations for a candidate
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getJobRecommendations(req, res) {
  try {
    const { candidateId } = req.params;
    const { limit = 10, minMatchPercentage = 50 } = req.query;
    
    // Get candidate data
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        licenses: true,
        certifications: true,
        preferences: true
      }
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Get available jobs
    const jobs = await prisma.job.findMany({
      where: {
        status: 'ACTIVE',
        startDate: {
          gte: new Date()
        }
      },
      include: {
        facility: true,
        requiredCertifications: true
      }
    });
    
    // Format candidate data for matching algorithm
    const formattedCandidate = {
      specialty: candidate.specialty,
      yearsExperience: candidate.yearsExperience,
      location: {
        city: candidate.city,
        state: candidate.state,
        willingToRelocate: candidate.preferences?.willingToRelocate || false
      },
      certifications: candidate.certifications.map(cert => ({
        name: cert.name,
        issuingOrganization: cert.issuingOrganization,
        expirationDate: cert.expirationDate
      })),
      licenses: candidate.licenses.map(license => ({
        state: license.state,
        licenseNumber: license.licenseNumber,
        expirationDate: license.expirationDate
      }))
    };
    
    // Format jobs data for matching algorithm
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      specialty: job.specialty,
      requiredExperience: job.requiredExperience,
      location: {
        city: job.facility.city,
        state: job.facility.state
      },
      requiredCertifications: job.requiredCertifications.map(cert => cert.name),
      state: job.facility.state
    }));
    
    // Find matching jobs
    const matchingJobs = findMatchingJobs(formattedCandidate, formattedJobs, {
      minMatchPercentage: parseInt(minMatchPercentage),
      limit: parseInt(limit),
      includeScores: true
    });
    
    // Get full job details for matched jobs
    const jobDetails = await Promise.all(
      matchingJobs.map(async match => {
        const job = await prisma.job.findUnique({
          where: { id: match.job.id },
          include: {
            facility: true,
            requiredCertifications: true
          }
        });
        
        return {
          ...job,
          matchPercentage: match.matchPercentage,
          isStrongMatch: match.isStrongMatch,
          scores: match.scores
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: jobDetails,
      message: 'Job recommendations retrieved successfully'
    });
  } catch (error) {
    console.error('Error in getJobRecommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

/**
 * Get candidate recommendations for a job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getCandidateRecommendations(req, res) {
  try {
    const { jobId } = req.params;
    const { limit = 10, minMatchPercentage = 50 } = req.query;
    
    // Get job data
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        facility: true,
        requiredCertifications: true
      }
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Get available candidates
    const candidates = await prisma.candidate.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        licenses: true,
        certifications: true,
        preferences: true
      }
    });
    
    // Format job data for matching algorithm
    const formattedJob = {
      specialty: job.specialty,
      requiredExperience: job.requiredExperience,
      location: {
        city: job.facility.city,
        state: job.facility.state
      },
      requiredCertifications: job.requiredCertifications.map(cert => cert.name),
      state: job.facility.state
    };
    
    // Format candidates data for matching algorithm
    const formattedCandidates = candidates.map(candidate => ({
      id: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      specialty: candidate.specialty,
      yearsExperience: candidate.yearsExperience,
      location: {
        city: candidate.city,
        state: candidate.state,
        willingToRelocate: candidate.preferences?.willingToRelocate || false
      },
      certifications: candidate.certifications.map(cert => ({
        name: cert.name,
        issuingOrganization: cert.issuingOrganization,
        expirationDate: cert.expirationDate
      })),
      licenses: candidate.licenses.map(license => ({
        state: license.state,
        licenseNumber: license.licenseNumber,
        expirationDate: license.expirationDate
      }))
    }));
    
    // Find matching candidates
    const matchingCandidates = findMatchingCandidates(formattedJob, formattedCandidates, {
      minMatchPercentage: parseInt(minMatchPercentage),
      limit: parseInt(limit),
      includeScores: true
    });
    
    // Get full candidate details for matched candidates
    const candidateDetails = await Promise.all(
      matchingCandidates.map(async match => {
        const candidate = await prisma.candidate.findUnique({
          where: { id: match.candidate.id },
          include: {
            licenses: true,
            certifications: true
          }
        });
        
        return {
          ...candidate,
          matchPercentage: match.matchPercentage,
          isStrongMatch: match.isStrongMatch,
          scores: match.scores
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: candidateDetails,
      message: 'Candidate recommendations retrieved successfully'
    });
  } catch (error) {
    console.error('Error in getCandidateRecommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

/**
 * Calculate match score between a candidate and a job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function calculateJobCandidateMatch(req, res) {
  try {
    const { jobId, candidateId } = req.params;
    
    // Get job data
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        facility: true,
        requiredCertifications: true
      }
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Get candidate data
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        licenses: true,
        certifications: true,
        preferences: true
      }
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Format job data for matching algorithm
    const formattedJob = {
      specialty: job.specialty,
      requiredExperience: job.requiredExperience,
      location: {
        city: job.facility.city,
        state: job.facility.state
      },
      requiredCertifications: job.requiredCertifications.map(cert => cert.name),
      state: job.facility.state
    };
    
    // Format candidate data for matching algorithm
    const formattedCandidate = {
      specialty: candidate.specialty,
      yearsExperience: candidate.yearsExperience,
      location: {
        city: candidate.city,
        state: candidate.state,
        willingToRelocate: candidate.preferences?.willingToRelocate || false
      },
      certifications: candidate.certifications.map(cert => ({
        name: cert.name,
        issuingOrganization: cert.issuingOrganization,
        expirationDate: cert.expirationDate
      })),
      licenses: candidate.licenses.map(license => ({
        state: license.state,
        licenseNumber: license.licenseNumber,
        expirationDate: license.expirationDate
      }))
    };
    
    // Calculate match score
    const { calculateMatchScore } = require('../../../ai/job-matcher');
    const matchResult = calculateMatchScore(formattedCandidate, formattedJob);
    
    res.status(200).json({
      success: true,
      data: {
        job,
        candidate,
        matchPercentage: matchResult.matchPercentage,
        isStrongMatch: matchResult.isStrongMatch,
        scores: matchResult.scores
      },
      message: 'Match score calculated successfully'
    });
  } catch (error) {
    console.error('Error calculating match score:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}

module.exports = {
  getJobRecommendations,
  getCandidateRecommendations,
  calculateJobCandidateMatch
};