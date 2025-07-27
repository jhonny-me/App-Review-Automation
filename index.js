const config = require('./config');
const IosReviewService = require('./services/iosReviewService');
const AndroidReviewService = require('./services/androidReviewService');
const TranslationService = require('./services/translationService');
const excel = require('./utils/excelHelper');

// Initialize translation service
const translationService = new TranslationService(config.translation.appId, config.translation.apiKey);

// Main function
async function main() {
  try {
    const workbook = excel.createWorkbook();
    // Process iOS reviews
    const iosService = new IosReviewService(config.ios);
    let iosReviews = await iosService.fetchReviews();
    // Translate iOS reviews
    iosReviews = await Promise.all(iosReviews.map(async review => {
      review.translatedReview = await translationService.translate(review.review);
      return review;
    }));
    excel.addSheet(workbook, 'iOS', iosReviews, [...excel.commonColumns, 'translatedReview']);
    
    // Process Android reviews
    const androidService = new AndroidReviewService(config.android);
    let androidReviews = await androidService.fetchReviews();
    // Translate Android reviews
    androidReviews = await Promise.all(androidReviews.map(async review => {
      review.translatedReview = await translationService.translate(review.review);
      return review;
    }));
    excel.addSheet(workbook, 'Android', androidReviews, [...excel.commonColumns, 'translatedReview']);
    
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