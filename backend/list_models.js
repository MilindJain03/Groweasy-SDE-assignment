require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your_gemini_api_key_here') {
  console.error('No GEMINI_API_KEY set in .env');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.error) {
        console.error('API Error:', json.error.message);
        return;
      }
      const generateContentModels = (json.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));
      console.log('\n✅ Models that support generateContent:\n');
      generateContentModels.forEach(m => console.log(' -', m));
    } catch(e) {
      console.error('Parse error:', e.message);
      console.log('Raw response:', data.slice(0, 500));
    }
  });
}).on('error', err => console.error('Request failed:', err.message));
