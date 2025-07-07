// Comprehensive audio testing for Bob3 app
// Add this to browser console to test audio functionality

function testAudioPlayback() {
  const testUrl = 'https://bob-explorer-webhook-production.up.railway.app/media/audio/1751141736783_1627386044622373.ogg';
  
  console.log('🎵 COMPREHENSIVE AUDIO TEST');
  console.log('🎯 Testing URL:', testUrl);
  console.log('🎯 User Agent:', navigator.userAgent);
  console.log('🎯 Audio Context Available:', !!window.AudioContext || !!window.webkitAudioContext);
  
  // Test 1: Basic Audio Element
  console.log('\n📋 TEST 1: Basic Audio Element');
  const audio = new Audio();
  audio.volume = 1.0;
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';
  
  audio.addEventListener('loadstart', () => console.log('✅ Load started'));
  audio.addEventListener('loadedmetadata', () => console.log('✅ Metadata loaded'));
  audio.addEventListener('loadeddata', () => console.log('✅ Data loaded'));
  audio.addEventListener('canplay', () => console.log('✅ Can play'));
  audio.addEventListener('canplaythrough', () => console.log('✅ Can play through'));
  audio.addEventListener('play', () => console.log('✅ Playing'));
  audio.addEventListener('ended', () => console.log('✅ Ended'));
  audio.addEventListener('error', (e) => {
    console.error('❌ Error:', e);
    console.error('❌ Error code:', e.target.error?.code);
    console.error('❌ Error message:', e.target.error?.message);
  });
  
  audio.src = testUrl;
  
  setTimeout(() => {
    console.log('\n📋 TEST 2: Manual Play');
    console.log('🎵 Volume:', audio.volume);
    console.log('🎵 Ready State:', audio.readyState);
    console.log('🎵 Network State:', audio.networkState);
    console.log('🎵 Duration:', audio.duration);
    
    audio.play()
      .then(() => console.log('✅ Play promise resolved'))
      .catch(err => console.error('❌ Play promise rejected:', err));
  }, 2000);
  
  // Test 2: Fetch the URL directly
  console.log('\n📋 TEST 3: Fetch URL Directly');
  fetch(testUrl)
    .then(response => {
      console.log('✅ Fetch status:', response.status);
      console.log('✅ Fetch headers:', response.headers.get('content-type'));
      console.log('✅ Fetch size:', response.headers.get('content-length'));
      return response.blob();
    })
    .then(blob => {
      console.log('✅ Blob size:', blob.size);
      console.log('✅ Blob type:', blob.type);
      
      // Create blob URL and test
      const blobUrl = URL.createObjectURL(blob);
      console.log('✅ Blob URL created:', blobUrl);
      
      const blobAudio = new Audio(blobUrl);
      blobAudio.volume = 1.0;
      blobAudio.addEventListener('canplay', () => {
        console.log('✅ Blob audio can play');
        blobAudio.play()
          .then(() => console.log('✅ Blob audio playing'))
          .catch(err => console.error('❌ Blob audio error:', err));
      });
    })
    .catch(err => console.error('❌ Fetch error:', err));
  
  // Test 3: AudioContext (if available)
  if (window.AudioContext || window.webkitAudioContext) {
    console.log('\n📋 TEST 4: AudioContext');
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    
    fetch(testUrl)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        console.log('✅ AudioContext decoded successfully');
        console.log('✅ Duration:', audioBuffer.duration);
        console.log('✅ Channels:', audioBuffer.numberOfChannels);
        console.log('✅ Sample Rate:', audioBuffer.sampleRate);
        
        // Play using AudioContext
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
        console.log('✅ AudioContext playing');
      })
      .catch(err => console.error('❌ AudioContext error:', err));
  }
  
  return audio;
}

// Run the test
window.audioTest = testAudioPlayback();

// Additional manual tests
console.log('\n🔧 MANUAL TESTS:');
console.log('• Run: audioTest.play() - to play test audio');
console.log('• Run: audioTest.pause() - to pause test audio');
console.log('• Check browser audio settings');
console.log('• Check Windows audio mixer');
console.log('• Try different browsers (Chrome, Edge, Firefox)');
