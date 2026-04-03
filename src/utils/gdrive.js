import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

let driveClient = null;

async function getDrive() {
  if (driveClient) return driveClient;

  let credentials;
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  } else {
    credentials = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY || '',
    };
  }

  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: SCOPES,
  });

  const client = await auth.getClient();
  console.log('[GDrive] Authorized successfully');

  driveClient = google.drive({ version: 'v3', auth: client });
  return driveClient;
}

/**
 * Upload a file buffer to Google Drive
 * @param {Buffer} buffer - file content
 * @param {string} filename - original filename
 * @param {string} mimeType - file MIME type
 * @returns {{ url: string, driveFileId: string }}
 */
export async function uploadToDrive(buffer, filename, mimeType) {
  const drive = await getDrive();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const res = await drive.files.create({
    requestBody: {
      name: `${Date.now()}-${filename}`,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  // Make file readable by anyone with the link
  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
    supportsAllDrives: true,
  });

  return {
    url: `https://drive.google.com/file/d/${res.data.id}/view`,
    driveFileId: res.data.id,
  };
}

/**
 * Delete a file from Google Drive
 * @param {string} fileId - Google Drive file ID
 */
export async function deleteFromDrive(fileId) {
  const drive = await getDrive();
  await drive.files.delete({ fileId, supportsAllDrives: true });
}

/**
 * Extract Drive file ID from a Drive URL
 */
export function extractDriveFileId(url) {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
