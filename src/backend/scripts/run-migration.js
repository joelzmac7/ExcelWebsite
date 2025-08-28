#!/usr/bin/env node

/**
 * Run Nexus Job Migration
 * 
 * This script runs the Nexus job data migration and provides
 * command line options for customization.
 */

const { migrateJobs } = require('./nexus-job-migration');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('batch-size', {
    alias: 'b',
    type: 'number',
    default: 100,
    description: 'Number of jobs to process in each batch'
  })
  .option('start-page', {
    alias: 's',
    type: 'number',
    default: 1,
    description: 'Page number to start from'
  })
  .option('end-page', {
    alias: 'e',
    type: 'number',
    description: 'Page number to end at (optional)'
  })
  .option('dry-run', {
    alias: 'd',
    type: 'boolean',
    default: false,
    description: 'Run in dry-run mode without saving to database'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    default: false,
    description: 'Enable verbose logging'
  })
  .help()
  .alias('help', 'h')
  .argv;

// Configure environment based on command line options
process.env.NEXUS_BATCH_SIZE = argv.batchSize;
process.env.NEXUS_START_PAGE = argv.startPage;
process.env.NEXUS_END_PAGE = argv.endPage;
process.env.NEXUS_DRY_RUN = argv.dryRun;
process.env.NEXUS_VERBOSE = argv.verbose;

// Display run configuration
console.log('Running Nexus Job Migration with the following configuration:');
console.log(`- Batch Size: ${argv.batchSize}`);
console.log(`- Start Page: ${argv.startPage}`);
if (argv.endPage) {
  console.log(`- End Page: ${argv.endPage}`);
} else {
  console.log('- End Page: (all available pages)');
}
console.log(`- Dry Run: ${argv.dryRun ? 'Yes' : 'No'}`);
console.log(`- Verbose Logging: ${argv.verbose ? 'Yes' : 'No'}`);
console.log('');

// Run the migration
console.log('Starting migration...');
const startTime = Date.now();

migrateJobs()
  .then(results => {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    console.log('\nMigration completed successfully:');
    console.log(`- Total Jobs: ${results.totalJobs}`);
    console.log(`- Successfully Processed: ${results.successfulJobs}`);
    console.log(`- Failed: ${results.failedJobs}`);
    console.log(`- Duration: ${duration.toFixed(2)} seconds`);
    
    if (argv.dryRun) {
      console.log('\nNOTE: This was a dry run. No data was saved to the database.');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('\nMigration failed:');
    console.error(error);
    process.exit(1);
  });