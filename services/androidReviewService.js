const { google } = require('googleapis');
const { getCountryInfo } = require('../utils/countryUtils');
const { formatDate } = require('../utils/excelHelper');

class AndroidReviewService {
  constructor(config) {
    if (!config || !config.packageName || !config.auth || !config.auth.client_email || !config.auth.private_key) {
      throw new Error('Missing required Android configuration');
    }

    this.config = config;
    this.androidPublisher = null;
    this._initializeClient();
  }

  _initializeClient() {
    try {
      const auth = new google.auth.JWT({
        email: this.config.auth.client_email,
        key: this.config.auth.private_key,
        scopes: ['https://www.googleapis.com/auth/androidpublisher']
      });

      this.androidPublisher = google.androidpublisher({
        version: 'v3',
        auth
      });
    } catch (error) {
      throw new Error(`Android client initialization failed: ${error.message}`);
    }
  }

  async fetchReviews() {
    try {
      const response = await this.androidPublisher.reviews.list({
        packageName: this.config.packageName,
        maxResults: this.config.maxResults
      });

      return this._processReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch Android reviews:', error.message);
      throw new Error(`Android review fetch failed: ${error.message}`);
    }
  }

  _processReviews(reviews) {
    return reviews.map(review => {
      const userComment = review.comments[0]?.userComment || {};
      const developerComment = review.comments[1]?.developerComment || {};
      const countryObj = getCountryInfo(userComment.reviewerLanguage || '');

      return {
        version: userComment.appVersionName || 'N/A',
        author: review.authorName || 'Anonymous',
        date: formatDate(this._timestampToDate(userComment.lastModified)),
        rating: userComment.starRating || 0,
        title: userComment.title || '',
        review: userComment.text || '',
        countryObj,
        country: countryObj.name,
        developerReply: developerComment.text || '',
        replyDate: developerComment.lastModified 
          ? formatDate(this._timestampToDate(developerComment.lastModified))
          : ''
      };
    });
  }

  _timestampToDate(timestamp) {
    if (!timestamp || !timestamp.seconds) return null;
    return new Date(timestamp.seconds * 1000);
  }

  async _makeRequest(method, params = {}) {
    try {
      const response = await this.androidPublisher[method]({
        packageName: this.config.packageName,
        ...params
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error?.message ||
        error.message ||
        'Android API request failed'
      );
    }
  }
}

module.exports = AndroidReviewService;