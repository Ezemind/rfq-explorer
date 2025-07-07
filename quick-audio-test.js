// Quick audio system test
// Run in Bob3 app browser console (F12)

console.log('🎵 QUICK AUDIO SYSTEM TEST');

// Test 1: System audio availability
console.log('🔊 Audio Context:', !!window.AudioContext || !!window.webkitAudioContext);
console.log('🔊 Media Devices:', !!navigator.mediaDevices);

// Test 2: Create simple beep test
function testSystemAudio() {
  if (window.AudioContext || window.webkitAudioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    
    // Create a simple tone
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.value = 440; // A4 note
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
    
    console.log('✅ Test beep should play now');
    return true;
  } else {
    console.log('❌ AudioContext not available');
    return false;
  }
}

// Test 3: Audio element test with simple sound
function testAudioElement() {
  // Create data URL for a simple wav file (beep)
  const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEbBjaY3e7AcSAEJ4/V8cKKOgYTaL/u458NAwxRp+PwtmMcBjiS2PLNeSsFK4DL8tmKOAYUXrno66hVFApGn+DyvmEbBjaY3e7AcSAEK4/V8cOKOgcTasDu458MBAxRpu3wtWIcBSuS2PLNeSsGMYDL8tqJNwYTXrvo66hWFAlFnt7zv2EbBjGY3e7BciAEJo7U8cOIOQcTXrvt76CNBAxRpu3wtWMdBhSN0+nHeikLNHW/8N2ROQUaMKzJx6nZEicdHaKjm9QkFBwTF1MSWEMRCAC56O28niUSFG8WnvpXXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tVXVJgGxzd6LfnpCFVX1tV';
  
  const audio = new Audio(audioData);
  audio.volume = 1.0;
  
  audio.play()
    .then(() => console.log('✅ Test audio element working'))
    .catch(err => console.error('❌ Test audio element failed:', err));
}

// Run tests
console.log('\n🧪 Running system audio tests...');
testSystemAudio();
setTimeout(testAudioElement, 1000);

// Test actual voice message URL
setTimeout(() => {
  console.log('\n🎵 Testing actual voice message...');
  const voiceUrl = 'https://bob-explorer-webhook-production.up.railway.app/media/audio/1751141736783_1627386044622373.ogg';
  const voiceAudio = new Audio(voiceUrl);
  voiceAudio.volume = 1.0;
  
  voiceAudio.addEventListener('loadstart', () => console.log('✅ Voice: Load started'));
  voiceAudio.addEventListener('canplay', () => console.log('✅ Voice: Can play'));
  voiceAudio.addEventListener('play', () => console.log('✅ Voice: Playing'));
  voiceAudio.addEventListener('error', (e) => console.error('❌ Voice error:', e.target.error));
  
  voiceAudio.play()
    .then(() => console.log('✅ Voice message should be playing'))
    .catch(err => console.error('❌ Voice message failed:', err));
}, 2000);

console.log('\n🔧 If no sound:');
console.log('1. Check Windows volume mixer');
console.log('2. Check browser site permissions');
console.log('3. Try clicking play button first (user interaction)');
console.log('4. Check default audio device in Windows');
