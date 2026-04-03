import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

let driveClient = null;

function getDrive() {
  if (driveClient) return driveClient;

  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  // Handle both escaped \\n and literal \n from different env var sources
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

  console.log('[GDrive] Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'set' : 'MISSING');
  console.log('[GDrive] Key starts with:', privateKey.substring(0, 30));
  console.log('[GDrive] Folder:', process.env.GOOGLE_DRIVE_FOLDER_ID ? 'set' : 'MISSING');

  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    privateKey,
    SCOPES
  );

  driveClient = google.drive({ version: 'v3', auth });
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
  const drive = getDrive();
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
  });

  // Make file readable by anyone with the link
  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
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
  const drive = getDrive();
  await drive.files.delete({ fileId });
}

/**
 * Extract Drive file ID from a Drive URL
 */
export function extractDriveFileId(url) {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
