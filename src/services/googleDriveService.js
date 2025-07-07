// Google Drive Service for Bob Explorer App
// src/services/googleDriveService.js

const { google } = require('googleapis');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.auth = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Service account credentials
      const credentials = {
        type: "service_account",
        project_id: "disco-bridge-452511-r1",
        private_key_id: "27212fb58ceeb22a95368666b0af3613750df51e",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDCNM/XjJ3lpTcW\neE9UsPs0AO4WHctzfRgu0qsifSeSI0fdAL3EJ5Zw5zDUxrISyIEg31vvXvWWG2Bl\n45hSs8HTF4Yi2Nz+ti0A3/nV7vFyWYiOeagsmxgKZmAgJrgGQbVbay5arPh/lv+C\nT9miyxPRN6I5kDUYAyDirh4BkHQVpVnKAnhq1xm7KP58GT7ERSeYcCwVENrigMAw\nVUANIEbV6Bj7gPsBo3HQeJkFzmN/g8zkA72Gjo5YNehqi6sGD4ZUCUCo8CZB8r0n\nbRXFbu1qKzPBb1GSmXC0tX9+mzD0aRjiZ+F/Z2lLSgdANaQfUVHqVbtvwosYPcLY\nOtwBSn7zAgMBAAECggEAMSlJS9lOxylRjqCaBGhgzsNFgde8/tk12/R8Wdiwwa+o\nq2tanmMfFCmSFOrPfS3Acl/YV/oD1SHM/z3j+1uBvzv/OqcHGntnXQdVqTA5cqbz\niI2HYvNH3KoZv0nN39eWXzP8ofuTVEkXGRe5khoyRA3/RO8aYZ+5HWjSM7cri6bE\nzDHYavczCImQgVb3bbtpHCwRMEQAZ4UjgGnAaL6vmqf//Owj4nhh+T4X0PRRWUwG\nUUJOI986OlaavF4e03MLjZ8DHIbSG3yEx2P3EpaVnZZIwgWQ6fL4qxE3D4vMhqgg\ncOSeYrne0PzPrEwqx1eMB2WG8/Pq55+NbPChYASCIQKBgQDrY5FUEAXKSP7SoGot\nPZJy0W8E35eBmYfVvc3nVuyC04m6Tf5xC/nrCkNWF714owlWm5UqhXvjaNYV4ABO\njHpCTsu2nqmMBDrrgd23NkgC/oj/I2xROArLUDK83Af4fohALFSSbOKV2+Sauk/o\nInZC+2z1p0fycxEZmXqHghBvWQKBgQDTNhop3dUjIdpI0tWqOGtPN5IfJhYeAbAw\ncwDOeSvUKQOQYdWbWzmNalS5bHmBArnbxKRIiBKqimGQosnmZ1h7p4D9/uOGm67d\naBJPPjy7YliAeKIExkRp2/qwGyudplo1rr6qZytVUeXceR99xw7qiEzSWhpi5AiB\nbPNm2Y/DKwKBgFXZRIGiLlpucPGkq9TAJg9WLuVaHsmXkyDzTotW+n9kY1DdbTUR\npx5/6bsWgXXkEF3T9H1DncF81Me5oKMFPPm9/zIlf7SfPlXyUUimtXDSIGjdJH4i\nsF0ibL7QiN+qVksBX/7fU2xQfHmqBcal+vfG9yBI2EamjNAHV9bgKtpRAoGAH/xw\nh+idb52f1il/zDCRJ8UNrwPwk4jD6wJvm9VD6vRvIr1+QPHWzHDO9enUmNIV3Y9x\nJb7dvNAKKIJOu0LpZoieg1jHkkofeE5bf364adRh/MrIFpsEH1f+Jg9nUo+v17No\nEpxfNqOZgQMi3sR3oNMVd0HH/zPzic47KldGa1MCgYEAy6NRMfnD0rTqEgwyAgxX\nNIqa50PmAe3eRRBBihWlJ4pvJAn6maMUhjUTUeBjKBsU5pD1uk5TOz4A0AtG9x/j\nV+xzC6fZlMgNF3Ru9Je30K04aoRkvqpH2l3WZPx+oPF6g0VKh59dplVpk9klwG58\njm4ewPTyApKpnMytiCC584E=\n-----END PRIVATE KEY-----\n",
        client_email: "bob-audio-service@disco-bridge-452511-r1.iam.gserviceaccount.com",
        client_id: "110325846893334481754",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/bob-audio-service%40disco-bridge-452511-r1.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      };

      // Create JWT auth client
      this.auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/drive.file'
        ]
      );

      // Initialize Drive API
      this.drive = google.drive({ version: 'v3', auth: this.auth });

      // Test authentication
      await this.auth.authorize();
      console.log('✅ Google Drive service authenticated successfully');

      this.initialized = true;
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Google Drive service:', error);
      return false;
    }
  }

  /**
   * Get authenticated download URL for a Google Drive file
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<string>} - Authenticated download URL
   */
  async getAuthenticatedDownloadUrl(fileId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get file metadata to verify access
      const fileMetadata = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size'
      });

      console.log('📁 File metadata:', fileMetadata.data);

      // Get download URL with authentication
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'arraybuffer'
      });

      // Create a blob URL for the audio data
      const blob = new Blob([response.data], { 
        type: fileMetadata.data.mimeType || 'audio/ogg' 
      });
      
      const blobUrl = URL.createObjectURL(blob);
      console.log('✅ Created authenticated blob URL for file:', fileId);
      
      return blobUrl;

    } catch (error) {
      console.error('❌ Error getting authenticated download URL:', error);
      throw error;
    }
  }

  /**
   * Extract file ID from Google Drive URL
   * @param {string} url - Google Drive URL
   * @returns {string|null} - File ID or null
   */
  extractFileIdFromUrl(url) {
    if (!url) return null;

    // Match various Google Drive URL formats
    const patterns = [
      /[?&]id=([a-zA-Z0-9_-]+)/,
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /\/open\?id=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }
}

// Create singleton instance
const googleDriveService = new GoogleDriveService();

export default googleDriveService;
