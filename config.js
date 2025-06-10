require('dotenv').config();

function getConfig() {
  // Validate required environment variables
  const requiredVars = [
    'IOS_ISSUER_ID', 'IOS_KEY_ID', 'IOS_PRIVATE_KEY_PATH',
    'IOS_APP_ID', 'ANDROID_PACKAGE_NAME',
    'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    ios: {
      issuerId: process.env.IOS_ISSUER_ID,
      keyId: process.env.IOS_KEY_ID,
      privateKeyPath: process.env.IOS_PRIVATE_KEY_PATH,
      appId: process.env.IOS_APP_ID,
      appName: process.env.IOS_APP_NAME,
      maxResults: parseInt(process.env.IOS_MAX_RESULTS) || 10
    },
    android: {
      packageName: process.env.ANDROID_PACKAGE_NAME,
      auth: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      maxResults: parseInt(process.env.ANDROID_MAX_RESULTS) || 20
    },
    output: {
      filePath: process.env.OUTPUT_FILE_PATH || './app_reviews.xlsx'
    }
  };
}

module.exports = getConfig();