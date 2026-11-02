const fs = require('fs');
const path = require('path');

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Sends the exported Excel file to a private destination, configured through the action inputs.
// The url and headers usually carry credentials, so they are never printed.
async function main() {
  const {
    REVIEWS_FILE: file,
    DESTINATION_URL: url,
    DESTINATION_METHOD: method = 'PUT',
    DESTINATION_HEADERS: headersJson,
    DESTINATION_FIELD: field
  } = process.env;

  if (!file || !url) {
    throw new Error('REVIEWS_FILE and DESTINATION_URL are required');
  }

  let headers = {};
  if (headersJson) {
    try {
      headers = JSON.parse(headersJson);
    } catch {
      throw new Error('destination-headers is not valid JSON');
    }
  }

  const data = fs.readFileSync(file);
  let body = data;
  if (field) {
    body = new FormData();
    body.append(field, new Blob([data], { type: XLSX_MIME }), path.basename(file));
  } else if (!Object.keys(headers).some(name => name.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = XLSX_MIME;
  }

  const response = await fetch(url, { method: method.toUpperCase(), headers, body });
  if (!response.ok) {
    throw new Error(`Destination responded with ${response.status} ${response.statusText}`);
  }
  console.log(`Sent ${path.basename(file)} to the destination (${response.status})`);
}

main().catch(error => {
  console.error('Upload to destination failed:', error.message);
  process.exit(1);
});
