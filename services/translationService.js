const axios = require('axios');
const crypto = require('crypto');

class TranslationService {
  constructor(appId, apiKey) {
    this.appId = appId;
    this.apiKey = apiKey;
    this.baseUrl = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
  }

  async translate(text, targetLanguage = 'en') {
    try {
      const salt = Date.now();
      const signStr = this.appId + text + salt + this.apiKey;
      const sign = crypto.createHash('md5').update(signStr).digest('hex');

      const response = await axios.get(this.baseUrl, {
        params: {
          q: text,
          from: 'auto',
          to: targetLanguage,
          appid: this.appId,
          salt: salt,
          sign: sign,
        },
      });

      if (response.data.error_code) {
        console.error('Translation error:', response.data.error_msg);
        return text;
      }

      // Concatenate all 'dst' values if there are multiple results
      if (Array.isArray(response.data.trans_result)) {
        return response.data.trans_result.map(item => item.dst).join('\n');
      }
      return text;
    } catch (error) {
      console.error('Translation error:', error.message);
      return text;
    }
  }
}

module.exports = TranslationService;