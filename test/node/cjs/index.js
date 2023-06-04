if ('Bun' in globalThis) {
  throw new Error('❌ Use Node.js to run this test!');
}

const { apollo } = require('@elysiajs/apollo');

if (typeof apollo !== 'function') {
  throw new Error('❌ CommonJS Node.js failed');
}

console.log('✅ CommonJS Node.js works!');
