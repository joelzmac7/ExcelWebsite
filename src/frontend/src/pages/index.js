import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Will implement search functionality in Phase 1
    console.log('Searching for:', { searchTerm, searchLocation });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Excel Medical Staffing | Healthcare Jobs</title>
        <meta name="description" content="Find your next healthcare job with Excel Medical Staffing. Browse thousands of travel nursing, allied health, and permanent positions nationwide." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">Excel Medical Staffing</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-blue-600">Jobs</a>
              <a href="#" className="text-gray-700 hover:text-blue-600">Specialties</a>
              <a href="#" className="text-gray-700 hover:text-blue-600">Locations</a>
              <a href="#" className="text-gray-700 hover:text-blue-600">Resources</a>
              <a href="#" className="text-gray-700 hover:text-blue-600">About Us</a>
            </nav>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-blue-600 hover:text-blue-800">Sign In</a>
              <a href="#" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Sign Up</a>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
                Find Your Perfect Healthcare Job
              </h1>
              <p className="mt-3 max-w-md mx-auto text-xl text-white sm:text-2xl md:mt-5 md:max-w-3xl">
                Search thousands of travel nursing, allied health, and permanent positions nationwide.
              </p>
              
              {/* Search Form */}
              <div className="mt-10 max-w-xl mx-auto">
                <form onSubmit={handleSearch} className="sm:flex">
                  <div className="flex-1 min-w-0 sm:mr-2 mb-3 sm:mb-0">
                    <input
                      type="text"
                      placeholder="Job title or specialty"
                      className="block w-full px-4 py-3 rounded-md border-0 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-0 sm:mr-2 mb-3 sm:mb-0">
                    <input
                      type="text"
                      placeholder="City, state, or zip"
                      className="block w-full px-4 py-3 rounded-md border-0 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button
                      type="submit"
                      className="block w-full px-6 py-3 rounded-md bg-white text-blue-600 font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      Search Jobs
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Jobs Section */}
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Featured Jobs
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                Explore our top healthcare positions across the United States
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* This will be populated with actual job data in Phase 1 */}
              {[1, 2, 3, 4, 5, 6].map((job) => (
                <div key={job} className="bg-gray-50 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">ICU Registered Nurse</h3>
                      <p className="text-sm text-gray-500">Memorial Hospital</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      New
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Location:</span> San Francisco, CA
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Pay Rate:</span> $2,500/week
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Duration:</span> 13 weeks
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Shift:</span> Night Shift (7p-7a)
                    </p>
                  </div>
                  <div className="mt-6">
                    <a
                      href="#"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <a
                href="#"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View All Jobs
              </a>
            </div>
          </div>
        </div>

        {/* Specialties Section */}
        <div className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Browse by Specialty
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                Find positions in your healthcare specialty
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3 lg:grid-cols-4">
              {['ICU', 'Med/Surg', 'ER', 'Labor & Delivery', 'OR', 'PACU', 'Telemetry', 'Cath Lab'].map((specialty) => (
                <a
                  key={specialty}
                  href="#"
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center"
                >
                  <h3 className="text-lg font-medium text-gray-900">{specialty}</h3>
                  <p className="mt-2 text-sm text-gray-500">View all {specialty} jobs</p>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Why Choose Excel Medical Staffing
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                We're dedicated to finding the perfect match for healthcare professionals and facilities
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Top Paying Jobs</h3>
                <p className="mt-2 text-base text-gray-500">
                  We offer some of the highest paying positions in the healthcare industry.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Fast Placement</h3>
                <p className="mt-2 text-base text-gray-500">
                  Our AI-powered matching system helps you find and secure positions quickly.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Dedicated Support</h3>
                <p className="mt-2 text-base text-gray-500">
                  Our team of experienced recruiters provides personalized support throughout your journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-medium">Excel Medical Staffing</h3>
              <p className="mt-4 text-gray-300 text-sm">
                Connecting healthcare professionals with their perfect job opportunities nationwide.
              </p>
            </div>
            <div>
              <h3 className="text-white text-lg font-medium">For Job Seekers</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Browse Jobs</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Create Profile</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Job Alerts</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Resources</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-medium">For Facilities</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Post a Job</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Find Staff</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Workforce Solutions</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-medium">Connect With Us</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">About Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Contact</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white text-sm">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between">
            <p className="text-gray-300 text-sm">
              &copy; {new Date().getFullYear()} Excel Medical Staffing. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-300 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}