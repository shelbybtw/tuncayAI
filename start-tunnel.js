const { spawn } = require('child_process');
const readline = require('readline');

console.log('✨ Cloudflare hesabsız tuneli başladılır...');

// Cloudflare tunelini arxa fonda başladırıq
const cloudflared = spawn('npx', ['cloudflared', 'tunnel', '--url', 'http://localhost:8081'], {
  shell: true
});

let tunnelUrl = '';
let expoStarted = false;

// Cloudflare həm stdout, həm də stderr-ə log yazır
const handleOutput = (data) => {
  const line = data.toString();
  
  // Əgər tunel linki yaradılıbsa, onu tapırıq
  const match = line.match(/(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/);
  if (match && !tunnelUrl) {
    tunnelUrl = match[1];
    console.log(`\n🚀 Tunel linki uğurla yaradıldı: ${tunnelUrl}\n`);
    startExpo(tunnelUrl);
  }
};

cloudflared.stdout.on('data', handleOutput);
cloudflared.stderr.on('data', handleOutput);

cloudflared.on('close', (code) => {
  if (code !== null && code !== 0) {
    console.log(`❌ Tunel xətası ilə bağlandı (Kod: ${code}). Lütfən internet bağlantısını yoxlayın.`);
  }
  process.exit(code || 0);
});

// Expo-nu bu tunel linki ilə başladan funksiya
function startExpo(url) {
  if (expoStarted) return;
  expoStarted = true;

  console.log('📱 Expo Go tunel linki ilə başladılır...');

  // Mühit dəyişəninə (environment variable) tunel linkini mənimsədirik
  const env = { 
    ...process.env, 
    EXPO_PACKAGER_PROXY_URL: url 
  };

  // Expo start əmrini eyni terminala yönləndirərək (stdio: inherit) başladırıq
  const expo = spawn('npx', ['expo', 'start', '--lan'], {
    stdio: 'inherit',
    shell: true,
    env
  });

  // Expo bağlandıqda arxa fondakı tuneli də söndürürük
  expo.on('close', (code) => {
    cloudflared.kill();
    process.exit(code || 0);
  });
}
