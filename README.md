# App Review Automation

This project automates the process of fetching and exporting app reviews for mobile application from both the Apple App Store and Google Play Store. Reviews are collected and exported to an Excel file for further analysis.

## Features

- Fetches iOS app reviews from the App Store Connect API.
- Fetches Android app reviews from the Google Play Developer API.
- Exports reviews to an Excel file (`.xlsx`).

## Configuration

Before running the project, you must create a `.env` file in the project root. Use the provided `.env.example` as a template:

```bash
cp .env.example .env
```

Edit the `.env` file and fill in your credentials:

| Variable                  | Description                                 |
|---------------------------|---------------------------------------------|
| IOS_ISSUER_ID             | App Store Connect API Issuer ID             |
| IOS_KEY_ID                | App Store Connect API Key ID                |
| IOS_PRIVATE_KEY_PATH      | Path to your App Store Connect private key  |
| IOS_APP_ID                | Your iOS app's Apple ID                     |
| IOS_APP_NAME              | Your iOS app's name                         |
| IOS_MAX_RESULTS           | Max iOS reviews to fetch                    |
| ANDROID_PACKAGE_NAME      | Android app package name                    |
| GOOGLE_CLIENT_EMAIL       | Google service account client email         |
| GOOGLE_PRIVATE_KEY        | Google service account private key          |
| ANDROID_MAX_RESULTS       | Max Android reviews to fetch                |
| OUTPUT_FILE_PATH          | Output Excel file path                      |

**Note:** Never commit your `.env` file to version control.

## Usage

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Configure your `.env` file** as described above.

3. **Run the script:**

   ```bash
   npm start
   # or, if using a specific script:
   npm run fetch-reviews
   ```

   The reviews will be exported to the file specified in `OUTPUT_FILE_PATH` (default: `./app_reviews.xlsx`).

## License

MIT
