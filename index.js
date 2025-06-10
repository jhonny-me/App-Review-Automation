const config = require('./config');
const IosReviewService = require('./services/iosReviewService');
const AndroidReviewService = require('./services/androidReviewService');
const excel = require('./utils/excelHelper');

// Main function
async function main() {
  try {
    const workbook = excel.createWorkbook();
    // Process iOS reviews
    // Initialize with config
    const iosService = new IosReviewService(config.ios);
    const iosReviews = await iosService.fetchReviews();
    excel.addSheet(workbook, 'iOS', iosReviews, excel.commonColumns);
    
    // Process Android reviews
    const androidService = new AndroidReviewService(config.android);
    const androidReviews = await androidService.fetchReviews();
    excel.addSheet(workbook, 'Android', androidReviews, excel.commonColumns);
    
    // Save combined file
    await excel.saveWorkbook(workbook, config.output.filePath);
    console.log('Successfully exported reviews');
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

// Run the script
main();