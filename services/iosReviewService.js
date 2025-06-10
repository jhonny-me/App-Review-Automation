const fs = require("fs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const store = require("app-store-scraper");
const { getCountryInfo } = require("../utils/countryUtils");
const { formatDate } = require("../utils/excelHelper");

class IosReviewService {
  constructor(config) {
    if (
      !config ||
      !config.issuerId ||
      !config.keyId ||
      !config.privateKeyPath
    ) {
      throw new Error("Missing required iOS configuration");
    }
    this.config = config;
    this.baseUrl = "https://api.appstoreconnect.apple.com/v1";
    this.token = null;
  }

  async fetchReviews() {
    try {
      this.token = this._generateToken();
      const reviews = await this._fetchAppStoreReviews();
      return this._enhanceWithPublicData(reviews);
    } catch (error) {
      console.error("Failed to fetch iOS reviews:", error.message);
      throw new Error(`iOS review fetch failed: ${error.message}`);
    }
  }

  _generateToken() {
    try {
      // debug config
      console.log("this.config: ", this.config);
      const privateKey = fs.readFileSync(this.config.privateKeyPath);
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = 60 * 20; // 20 minutes (Apple's max)

      const payload = {
        iss: this.config.issuerId,
        iat: now,
        exp: now + expiresIn,
        aud: "appstoreconnect-v1",
      };

      return jwt.sign(payload, privateKey, {
        algorithm: "ES256",
        header: {
          alg: "ES256",
          kid: this.config.keyId,
          typ: "JWT",
        },
      });
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  async _fetchAppStoreReviews() {
    const url = `${this.baseUrl}/apps/${this.config.appId}/customerReviews`;
    const params = {
      limit: this.config.maxResults,
      sort: "-createdDate",
      "fields[customerReviews]":
        "rating,title,body,reviewerNickname,createdDate,territory,response",
      "fields[customerReviewResponses]":
        "responseBody,lastModifiedDate,state,review",
      include: "response",
    };

    try {
      console.log("Fetching App Store reviews...");
      const response = await this._makeRequest("GET", url, params);
      const reviews = response.data.data;
      console.log(`Found ${reviews.length} reviews`);

      return await Promise.all(
        reviews.map((review) => this._processReview(review))
      );
    } catch (error) {
      throw new Error(`App Store review fetch failed: ${error.message}`);
    }
  }

  async _fetchDeveloperResponse(reviewId) {
    try {
      const url = `${this.baseUrl}/customerReviews/${reviewId}/response`;
      const response = await this._makeRequest("GET", url);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) return null;
      console.warn(
        `Failed to fetch response for review ${reviewId}:`,
        error.message
      );
      return null;
    }
  }

  async _processReview(review) {
    const developerResponse = review.relationships?.response?.links?.related
      ? await this._fetchDeveloperResponse(review.id)
      : null;

    const attributes = review.attributes;
    const countryObj = getCountryInfo(attributes.territory);

    return {
      version: attributes.appStoreVersion || "",
      author: attributes.reviewerNickname,
      date: formatDate(attributes.createdDate),
      rating: attributes.rating,
      title: attributes.title,
      review: attributes.body,
      countryObj,
      country: countryObj.name,
      developerReply: developerResponse?.attributes?.responseBody || "",
      replyDate: developerResponse?.attributes?.lastModifiedDate
        ? formatDate(developerResponse.attributes.lastModifiedDate)
        : "",
    };
  }

  async _enhanceWithPublicData(reviews) {
    const countries = [...new Set(reviews.map((r) => r.countryObj.code2))];
    const publicReviewsByCountry = await this._fetchPublicReviewsByCountry(
      countries
    );

    return reviews.map((apiReview) => {
      const publicMatch = this._findPublicMatch(
        apiReview,
        publicReviewsByCountry
      );
      return publicMatch
        ? { ...apiReview, version: publicMatch.version || "N/A" }
        : apiReview;
    });
  }

  async _fetchPublicReviewsByCountry(countries) {
    const publicReviewsMap = new Map();

    await Promise.all(
      countries.map(async (country) => {
        try {
          console.log(`Fetching public reviews for ${country}...`);
          const publicReviews = await store.reviews({
            id: this.config.appId,
            country: country.toLowerCase(),
            sort: store.sort.RECENT,
            page: 1,
          });
          publicReviewsMap.set(country, publicReviews);
        } catch (error) {
          console.warn(
            `Failed to fetch public reviews for ${country}:`,
            error.message
          );
          publicReviewsMap.set(country, []);
        }
      })
    );

    return publicReviewsMap;
  }

  _findPublicMatch(apiReview, publicReviewsByCountry) {
    const publicReviews =
      publicReviewsByCountry.get(apiReview.countryObj.code2) || [];
    return publicReviews.find(
      (publicRev) =>
        publicRev.userName === apiReview.author &&
        publicRev.title === apiReview.title &&
        publicRev.text === apiReview.review
    );
  }

  async _makeRequest(method, url, params = null) {
    const config = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    };

    if (params) config.params = params;

    try {
      return await axios(config);
    } catch (error) {
      throw new Error(
        error.response?.data?.errors?.[0]?.detail ||
          error.message ||
          "Request failed"
      );
    }
  }
}

module.exports = IosReviewService;
