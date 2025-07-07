// Emergency audio testing utility
// Run this in browser console to diagnose audio issues

function runAudioDiagnostics() {
  console.log('🎵 AUDIO DIAGNOSTICS STARTING...');
  
  // Test 1: System audio capability
  console.log('\n📋 TEST 1: System Audio Capability');
  console.log('Audio Context support:', !!(window.AudioContext || window.webkitAudioContext));
  console.log('Media devices support:', !!navigator.mediaDevices);
  
  // Test 2: Create a simple test tone
  console.log('\n📋 TEST 2: Test Tone Generation');
  if (window.AudioContext || window.webkitAudioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    
    function playTestTone() {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = 440; // A4 note
      gainNode.gain.value = 0.5; // 50% volume
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1); // Play for 1 second
      
      console.log('✅ Test tone should be playing for 1 second');
      console.log('   If you can\'t hear it, the issue is system audio settings');
    }
    
    // Play test tone
    playTestTone();
  }
  
  // Test 3: Check audio output devices
  console.log('\n📋 TEST 3: Audio Output Devices');
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        console.log('Available audio outputs:', audioOutputs.length);
        audioOutputs.forEach((device, index) => {
          console.log(`  ${index + 1}. ${device.label || 'Unknown Device'} (${device.deviceId})`);
        });
      })
      .catch(err => console.error('❌ Cannot enumerate devices:', err));
  }
  
  // Test 4: Test with actual voice message
  console.log('\n📋 TEST 4: Voice Message Test');
  const testUrl = 'https://bob-explorer-webhook-production.up.railway.app/media/audio/1751141736783_1627386044622373.ogg';
  
  function testVoiceMessage() {
    const audio = new Audio(testUrl);
    audio.volume = 1.0;
    
    audio.addEventListener('loadstart', () => console.log('✅ Voice: Loading started'));
    audio.addEventListener('canplay', () => {
      console.log('✅ Voice: Can play');
      console.log('   Volume:', audio.volume);
      console.log('   Duration:', audio.duration);
    });
    audio.addEventListener('play', () => console.log('✅ Voice: Playing'));
    audio.addEventListener('ended', () => console.log('✅ Voice: Ended'));
    audio.addEventListener('error', (e) => {
      console.error('❌ Voice error:', e.target.error);
    });
    
    // Try to play
    audio.play()
      .then(() => console.log('✅ Voice message play started'))
      .catch(err => console.error('❌ Voice message play failed:', err));
    
    return audio;
  }
  
  setTimeout(testVoiceMessage, 2000);
  
  console.log('\n🔧 TROUBLESHOOTING CHECKLIST:');
  console.log('1. Check Windows Sound Mixer (Right-click speaker icon → Open Volume Mixer)');
  console.log('2. Ensure browser (Electron/Chrome) volume is not muted');
  console.log('3. Check Windows Default Playback Device');
  console.log('4. Try different headphones/speakers');
  console.log('5. Restart audio service: services.msc → Windows Audio → Restart');
  console.log('6. Update audio drivers');
}

// Auto-run diagnostics
runAudioDiagnostics();

// Manual tests you can run:
console.log('\n🎮 MANUAL TESTS:');
console.log('• window.testTone() - Play a simple beep');
console.log('• window.testVoice() - Test the actual voice file');

window.testTone = function() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.frequency.value = 800;
  gainNode.gain.value = 0.3;
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.5);
  
  console.log('🔊 Test tone played');
};

window.testVoice = function() {
  const audio = new Audio('https://bob-explorer-webhook-production.up.railway.app/media/audio/1751141736783_1627386044622373.ogg');
  audio.volume = 1.0;
  audio.play();
  console.log('🎵 Voice test played');
};
