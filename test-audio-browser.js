// Test audio playback directly in browser
// Run this in browser console to test if audio works

function testAudioPlayback(url) {
  console.log('🎵 Testing audio playback for:', url);
  
  const audio = new Audio(url);
  audio.volume = 1.0;
  
  audio.addEventListener('loadstart', () => console.log('✅ Load started'));
  audio.addEventListener('canplay', () => console.log('✅ Can play'));
  audio.addEventListener('loadeddata', () => console.log('✅ Data loaded'));
  audio.addEventListener('play', () => console.log('✅ Playing'));
  audio.addEventListener('ended', () => console.log('✅ Ended'));
  audio.addEventListener('error', (e) => console.error('❌ Error:', e));
  
  audio.play()
    .then(() => console.log('✅ Play promise resolved'))
    .catch(err => console.error('❌ Play promise rejected:', err));
  
  return audio;
}

// Test with the actual URL from your app
const testUrl = 'https://bob-explorer-webhook-production.up.railway.app/media/audio/1751141736783_1627386044622373.ogg';
const audioTest = testAudioPlayback(testUrl);

// To stop: audioTest.pause();
