require('dotenv').config({ path: './backend/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModel() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent('Hi');
    console.log('Success:', result.response.text());
  } catch (err) {
    console.error('Error with gemini-1.5-flash-latest:', err.message);
    try {
      console.log('Falling back to gemini-1.5-flash...');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('Hi');
      console.log('Success:', result.response.text());
    } catch(err2) {
      console.error('Error with gemini-1.5-flash:', err2.message);
      try {
        console.log('Falling back to gemini-pro...');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Hi');
        console.log('Success:', result.response.text());
      } catch (err3) {
        console.error('Error with gemini-pro:', err3.message);
      }
    }
  }
}

testModel();
