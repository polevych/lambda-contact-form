const { google } = require("googleapis");

// Environment variables
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const TABLE_NAME = process.env.TABLE_NAME;

// You have to base64 encode(https://www.base64encode.org) the entire service account JSON and store it in an environment variable.
const base64EncodedServiceAccount = process.env.BASE64_ENCODED_SERVICE_ACCOUNT;
const decodedServiceAccount = Buffer.from(base64EncodedServiceAccount, "base64").toString("utf-8");
const credentials = JSON.parse(decodedServiceAccount);

// Function to authenticate Google Sheets API
const authenticateGoogleSheetsAPI = () => {
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
};

// Function to get the next row index in the sheet
const getNextRowIndex = async (sheetsAPI) => {
  const response = await sheetsAPI.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: TABLE_NAME,
  });

  // Return the next row index
  return response.data.values ? response.data.values.length + 1 : 1;
};

// Function to append a new row to the sheet
const appendRowToSheet = async (sheetsAPI, nextRowIndex, rowData) => {
  await sheetsAPI.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TABLE_NAME}!A${nextRowIndex}`,
    valueInputOption: "RAW",
    resource: {
      values: [rowData],
    },
  });
};

// Lambda function handler
exports.handler = async (event, _) => {
  try {
    // Parse the JSON body from the request
    const requestBody = JSON.parse(event.body);

    // Extract values from the parsed body
    const { name, email, description } = requestBody;

    // Create Google Sheets API instance with authentication
    const sheetsAPI = google.sheets({ version: "v4", auth: authenticateGoogleSheetsAPI() });

    // Get the current values in the sheet to determine the next row index
    const nextRowIndex = await getNextRowIndex(sheetsAPI);

    // Prepare the new row data
    const newRowData = [name, email, description, "FALSE"]; // 'No' for the 'reviewed' column

    // Append the new row to the sheet
    await appendRowToSheet(sheetsAPI, nextRowIndex, newRowData);

    return {
      statusCode: 200,
      body: JSON.stringify("Row added successfully to Google Sheets!"),
    };
  } catch (error) {
    // Handle errors and return a 500 status code
    return {
      statusCode: 500,
      body: JSON.stringify(`Error: ${error.message}`),
    };
  }
};
