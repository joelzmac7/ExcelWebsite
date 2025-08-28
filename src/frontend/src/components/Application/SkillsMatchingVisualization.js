import React from 'react';
import PropTypes from 'prop-types';

/**
 * SkillsMatchingVisualization Component
 * 
 * A component for visualizing the match between candidate skills and job requirements
 * 
 * @param {Object} props - Component props
 * @param {Array} props.candidateSkills - Candidate's skills from resume
 * @param {Array} props.jobSkills - Skills required for the job
 * @param {number} props.overallMatch - Overall match percentage
 * @param {boolean} props.loading - Whether data is loading
 */
const SkillsMatchingVisualization = ({
  candidateSkills = [],
  jobSkills = [],
  overallMatch = 0,
  loading = false
}) => {
  // Calculate matched skills
  const matchedSkills = candidateSkills.filter(skill => 
    jobSkills.some(jobSkill => 
      jobSkill.toLowerCase().includes(skill.name.toLowerCase()) || 
      skill.name.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );
  
  // Calculate missing skills
  const missingSkills = jobSkills.filter(jobSkill => 
    !candidateSkills.some(skill => 
      jobSkill.toLowerCase().includes(skill.name.toLowerCase()) || 
      skill.name.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );
  
  // Calculate additional skills (skills the candidate has that aren't required)
  const additionalSkills = candidateSkills.filter(skill => 
    !jobSkills.some(jobSkill => 
      jobSkill.toLowerCase().includes(skill.name.toLowerCase()) || 
      skill.name.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );
  
  // Calculate match percentage
  const matchPercentage = jobSkills.length > 0 
    ? Math.round((matchedSkills.length / jobSkills.length) * 100) 
    : 0;
  
  // Get match color based on percentage
  const getMatchColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-green-400';
    if (percentage >= 50) return 'bg-yellow-400';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-400';
  };
  
  // Get skill badge color
  const getSkillBadgeColor = (skill) => {
    if (matchedSkills.some(s => s.name === skill.name)) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-blue-100 text-blue-800';
  };
  
  // If loading, show skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Skills Match Analysis
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Comparing your skills with job requirements.
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {/* Overall match score */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm font-medium text-gray-700">Overall Match</h4>
            <span className="text-sm font-medium text-gray-700">{matchPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${getMatchColor(matchPercentage)}`} 
              style={{ width: `${matchPercentage}%` }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {matchPercentage >= 80 
              ? 'Excellent match! Your skills align well with this position.'
              : matchPercentage >= 60
              ? 'Good match. You have many of the required skills for this position.'
              : matchPercentage >= 40
              ? 'Moderate match. You may want to highlight your relevant experience in your application.'
              : 'Limited match. Consider developing skills in the missing areas or explaining transferable skills in your application.'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matched skills */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Matched Skills</h4>
            {matchedSkills.length > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex flex-wrap gap-2">
                  {matchedSkills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-sm text-gray-500">No matched skills found.</p>
              </div>
            )}
          </div>
          
          {/* Missing skills */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Missing Skills</h4>
            {missingSkills.length > 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-sm text-gray-500">No missing skills. Great job!</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional skills */}
        {additionalSkills.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Skills</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex flex-wrap gap-2">
                {additionalSkills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                These are additional skills you have that weren't specifically mentioned in the job requirements.
              </p>
            </div>
          </div>
        )}
        
        {/* Skills comparison visualization */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Skills Comparison</h4>
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex items-center mb-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(candidateSkills.length / Math.max(candidateSkills.length, jobSkills.length)) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Your Skills ({candidateSkills.length})</span>
            </div>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${(jobSkills.length / Math.max(candidateSkills.length, jobSkills.length)) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Job Requirements ({jobSkills.length})</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">
          This analysis is based on keyword matching between your resume and the job description. 
          It's a helpful guide, but doesn't replace a thorough review of the job requirements.
        </p>
      </div>
    </div>
  );
};

SkillsMatchingVisualization.propTypes = {
  candidateSkills: PropTypes.array,
  jobSkills: PropTypes.array,
  overallMatch: PropTypes.number,
  loading: PropTypes.bool
};

export default SkillsMatchingVisualization;