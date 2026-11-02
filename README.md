# App Review Automation

A GitHub Action that fetches the latest app reviews from the Apple App Store (App Store Connect API) and Google Play (Play Developer API), translates them to English and exports them to an Excel file (`.xlsx`) with an `iOS` and an `Android` sheet.

The file is uploaded as a workflow artifact, returned as an action output so later steps can use it (send it to Slack, email, ...) and can optionally be sent to a private URL.

## Usage

Add a workflow to your repository, for example `.github/workflows/app-reviews.yml`:

```yaml
name: App reviews

on:
  schedule:
    - cron: "0 1 * * 1" # every Monday 01:00 UTC
  workflow_dispatch:

jobs:
  reviews:
    runs-on: ubuntu-latest
    steps:
      - uses: jhonny-me/App-Review-Automation@v1
        with:
          ios-issuer-id: ${{ secrets.IOS_ISSUER_ID }}
          ios-key-id: ${{ secrets.IOS_KEY_ID }}
          ios-private-key: ${{ secrets.IOS_PRIVATE_KEY }}
          ios-app-id: ${{ secrets.IOS_APP_ID }}
          android-package-name: com.example.app
          google-client-email: ${{ secrets.GOOGLE_CLIENT_EMAIL }}
          google-private-key: ${{ secrets.GOOGLE_PRIVATE_KEY }}
```

Add the credentials as repository secrets (Settings > Secrets and variables > Actions). `ios-private-key` is the full content of the `.p8` file, `google-private-key` is the `private_key` value of the service account JSON key. The action does not need a checkout of your repository.

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `ios-issuer-id` | yes | | App Store Connect API issuer ID |
| `ios-key-id` | yes | | App Store Connect API key ID |
| `ios-private-key` | yes | | Content of the App Store Connect API private key (`.p8`) |
| `ios-app-id` | yes | | Apple ID of the iOS app |
| `ios-app-name` | no | | Name of the iOS app |
| `ios-max-results` | no | `20` | Max iOS reviews to fetch |
| `android-package-name` | yes | | Android package name |
| `google-client-email` | yes | | Google service account client email |
| `google-private-key` | yes | | Google service account private key |
| `android-max-results` | no | `20` | Max Android reviews to fetch |
| `translation-app-id` | no | | [Baidu Translate](https://fanyi-api.baidu.com/manage/developer) app ID |
| `translation-api-key` | no | | Baidu Translate secret key |
| `output-file` | no | `app_reviews.xlsx` | Output path, relative to the workspace |
| `upload-artifact` | no | `true` | Upload the file as a workflow artifact |
| `artifact-name` | no | `app-reviews` | Artifact name |
| `artifact-retention-days` | no | `7` | Artifact retention, `0` uses the repository default |
| `destination-url` | no | | Send the file to this URL, see below |
| `destination-method` | no | `PUT` | HTTP method for `destination-url` |
| `destination-headers` | no | | JSON object with extra request headers |
| `destination-field` | no | | Send as `multipart/form-data` under this field instead of as raw body |

Without translation credentials the reviews are exported untranslated.

### Outputs

| Output | Description |
|---|---|
| `file-path` | Absolute path of the Excel file on the runner |
| `artifact-id` | ID of the uploaded artifact (empty when `upload-artifact` is `false`) |
| `artifact-url` | URL of the uploaded artifact (empty when `upload-artifact` is `false`) |

Use them in later steps, for example to post the file to Slack:

```yaml
      - uses: jhonny-me/App-Review-Automation@v1
        id: reviews
        with:
          # ... credentials as above

      - uses: slackapi/slack-github-action@v2
        with:
          method: files.uploadV2
          token: ${{ secrets.SLACK_BOT_TOKEN }}
          payload: |
            channel_id: ${{ secrets.SLACK_CHANNEL_ID }}
            initial_comment: "Latest app reviews"
            file: ${{ steps.reviews.outputs.file-path }}
            filename: app_reviews.xlsx
```

### Keeping the reviews private

Reviews contain text written by your users. **Artifacts of a public repository can be downloaded by anyone with a GitHub account**, and so can its workflow logs. Run the action in a private repository, or turn the artifact off and send the file to a destination only you can read:

```yaml
      - uses: jhonny-me/App-Review-Automation@v1
        with:
          # ... credentials as above
          upload-artifact: false
          destination-url: ${{ secrets.REVIEWS_DESTINATION_URL }}
          destination-headers: ${{ secrets.REVIEWS_DESTINATION_HEADERS }} # {"Authorization": "Bearer ..."}
```

The file is sent with one HTTP request to `destination-url`, as the raw body by default or as multipart form data when `destination-field` is set. This fits any service that accepts uploads over HTTP (a WebDAV or object storage URL, a presigned URL, a document tool's upload API). The action fails when the response is not 2xx. The URL and headers are never printed, pass them from secrets.

## Running locally

```bash
npm install
cp .env.example .env   # fill in your credentials
npm start
```

| Variable | Description |
|---|---|
| `IOS_ISSUER_ID` | App Store Connect API issuer ID |
| `IOS_KEY_ID` | App Store Connect API key ID |
| `IOS_PRIVATE_KEY_PATH` | Path to your App Store Connect private key |
| `IOS_APP_ID` | Your iOS app's Apple ID |
| `IOS_APP_NAME` | Your iOS app's name |
| `IOS_MAX_RESULTS` | Max iOS reviews to fetch |
| `ANDROID_PACKAGE_NAME` | Android app package name |
| `GOOGLE_CLIENT_EMAIL` | Google service account client email |
| `GOOGLE_PRIVATE_KEY` | Google service account private key |
| `ANDROID_MAX_RESULTS` | Max Android reviews to fetch |
| `TRANSLATION_APP_ID`, `TRANSLATION_API_KEY` | Baidu Translate credentials (optional) |
| `OUTPUT_FILE_PATH` | Output Excel file path (default `./app_reviews.xlsx`) |

Never commit your `.env` file or key files.

## License

[MIT](LICENSE)
