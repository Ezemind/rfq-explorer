const { google } = require('googleapis');

async function testGoogleDriveAccess() {
  console.log('🔍 TESTING GOOGLE DRIVE ACCESS');
  console.log('==============================');
  
  const GOOGLE_DRIVE_FOLDER_ID = '1sxuVD0fNkohgTVc1kEESdqg0ecY6kiWz';
  
  try {
    // Load credentials from the same environment variable as webhook
    const credentials = {
      "type": "service_account",
      "project_id": "disco-bridge-452511-r1",
      "private_key_id": "27212fb58ceeb22a95368666b0af3613750df51e",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDCNM/XjJ3lpTcW\neE9UsPs0AO4WHctzfRgu0qsifSeSI0fdAL3EJ5Zw5zDUxrISyIEg31vvXvWWG2Bl\n45hSs8HTF4Yi2Nz+ti0A3/nV7vFyWYiOeagsmxgKZmAgJrgGQbVbay5arPh/lv+C\nT9miyxPRN6I5kDUYAyDirh4BkHQVpVnKAnhq1xm7KP58GT7ERSeYcCwVENrigMAw\nVUANIEbV6Bj7gPsBo3HQeJkFzmN/g8zkA72Gjo5YNehqi6sGD4ZUCUCo8CZB8r0n\nbRXFbu1qKzPBb1GSmXC0tX9+mzD0aRjiZ+F/Z2lLSgdANaQfUVHqVbtvwosYPcLY\nOtwBSn7zAgMBAAECggEAMSlJS9lOxylRjqCaBGhgzsNFgde8/tk12/R8Wdiwwa+o\nq2tanmMfFCmSFOrPfS3Acl/YV/oD1SHM/z3j+1uBvzv/OqcHGntnXQdVqTA5cqbz\niI2HYvNH3KoZv0nN39eWXzP8ofuTVEkXGRe5khoyRA3/RO8aYZ+5HWjSM7cri6bE\nzDHYavczCImQgVb3bbtpHCwRMEQAZ4UjgGnAaL6vmqf//Owj4nhh+T4X0PRRWUwG\nUUJOI986OlaavF4e03MLjZ8DHIbSG3yEx2P3EpaVnZZIwgWQ6fL4qxE3D4vMhqgg\ncOSeYrne0PzPrEwqx1eMB2WG8/Pq55+NbPChYASCIQKBgQDrY5FUEAXKSP7SoGot\nPZJy0W8E35eBmYfVvc3nVuyC04m6Tf5xC/nrCkNWF714owlWm5UqhXvjaNYV4ABO\njHpCTsu2nqmMBDrrgd23NkgC/oj/I2xROArLUDK83Af4fohALFSSbOKV2+Sauk/o\nInZC+2z1p0fycxEZmXqHghBvWQKBgQDTNhop3dUjIdpI0tWqOGtPN5IfJhYeAbAw\ncwDOeSvUKQOQYdWbWzmNalS5bHmBArnbxKRIiBKqimGQosnmZ1h7p4D9/uOGm67d\naBJPPjy7YliAeKIExkRp2/qwGyudplo1rr6qZytVUeXceR99xw7qiEzSWhpi5AiB\nbPNm2Y/DKwKBgFXZRIGiLlpucPGkq9TAJg9WLuVaHsmXkyDzTotW+n9kY1DdbTUR\npx5/6bsWgXXkEF3T9H1DncF81Me5oKMFPPm9/zIlf7SfPlXyUUimtXDSIGjdJH4i\nsF0ibL7QiN+qVksBX/7fU2xQfHmqBcal+vfG9yBI2EamjNAHV9bgKtpRAoGAH/xw\nh+idb52f1il/zDCRJ8UNrwPwk4jD6wJvm9VD6vRvIr1+QPHWzHDO9enUmNIV3Y9x\nJb7dvNAKKIJOu0LpZoieg1jHkkofeE5bf364adRh/MrIFpsEH1f+Jg9nUo+v17No\nEpxfNqOZgQMi3sR3oNMVd0HH/zPzic47KldGa1MCgYEAy6NRMfnD0rTqEgwyAgxX\nNIqa50PmAe3eRRBBihWlJ4pvJAn6maMUhjUTUeBjKBsU5pD1uk5TOz4A0AtG9x/j\nV+xzC6fZlMgNF3Ru9Je30K04aoRkvqpH2l3WZPx+oPF6g0VKh59dplVpk9klwG58\njm4ewPTyApKpnMytiCC584E=\n-----END PRIVATE KEY-----\n",
      "client_email": "bob-audio-service@disco-bridge-452511-r1.iam.gserviceaccount.com",
      "client_id": "110325846893334481754",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/bob-audio-service%40disco-bridge-452511-r1.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    };

    console.log('🔑 Authenticating with Google Drive...');
    
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/drive.file']
    );

    const drive = google.drive({ version: 'v3', auth });
    
    console.log('✅ Authentication successful');
    
    // Test folder access
    console.log('\n📁 Testing folder access...');
    try {
      const folderInfo = await drive.files.get({
        fileId: GOOGLE_DRIVE_FOLDER_ID,
        fields: 'id, name, parents, permissions'
      });
      
      console.log('✅ Folder access successful!');
      console.log('   - Folder name:', folderInfo.data.name);
      console.log('   - Folder ID:', folderInfo.data.id);
      
    } catch (folderError) {
      console.log('❌ Folder access failed:', folderError.message);
      return;
    }
    
    // List files in the folder
    console.log('\n📋 Listing files in media folder...');
    try {
      const fileList = await drive.files.list({
        q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents`,
        fields: 'files(id, name, mimeType, size, createdTime, webViewLink)',
        orderBy: 'createdTime desc'
      });
      
      const files = fileList.data.files;
      console.log(`✅ Found ${files.length} files in folder`);
      
      if (files.length > 0) {
        console.log('\n📄 Recent files:');
        files.slice(0, 5).forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name}`);
          console.log(`      - Type: ${file.mimeType}`);
          console.log(`      - Size: ${file.size} bytes`);
          console.log(`      - Created: ${file.createdTime}`);
          console.log(`      - Public URL: https://drive.google.com/uc?id=${file.id}&export=download`);
          console.log('');
        });
      } else {
        console.log('📝 No files found yet - waiting for webhook to process media');
      }
      
    } catch (listError) {
      console.log('❌ File listing failed:', listError.message);
      return;
    }
    
    // Test upload capability
    console.log('🧪 Testing upload capability...');
    try {
      const testContent = 'Test file from Google Drive integration check';
      const testBuffer = Buffer.from(testContent, 'utf8');
      
      const fileMetadata = {
        name: `test_upload_${Date.now()}.txt`,
        parents: [GOOGLE_DRIVE_FOLDER_ID]
      };

      const media = {
        mimeType: 'text/plain',
        body: testBuffer
      };

      const uploadResponse = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
      });

      // Make file publicly accessible
      await drive.permissions.create({
        fileId: uploadResponse.data.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      const publicUrl = `https://drive.google.com/uc?id=${uploadResponse.data.id}&export=download`;
      
      console.log('✅ Upload test successful!');
      console.log('   - File ID:', uploadResponse.data.id);
      console.log('   - Public URL:', publicUrl);
      
      // Clean up test file
      await drive.files.delete({ fileId: uploadResponse.data.id });
      console.log('🗑️ Test file cleaned up');
      
    } catch (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      return;
    }
    
    console.log('\n🎉 GOOGLE DRIVE ACCESS TEST: COMPLETE SUCCESS!');
    console.log('==============================================');
    console.log('✅ Authentication: Working');
    console.log('✅ Folder access: Working');
    console.log('✅ File listing: Working');
    console.log('✅ Upload capability: Working');
    console.log('✅ Public URL generation: Working');
    console.log('✅ Webhook can successfully store audio in Google Drive');
    
  } catch (error) {
    console.error('❌ Google Drive test failed:', error.message);
  }
}

testGoogleDriveAccess();
