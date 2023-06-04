if ('Bun' in globalThis) {
  throw new Error('❌ Use Node.js to run this test!');
}

import { apollo } from '@elysiajs/apollo';

if (typeof apollo !== 'function') {
  throw new Error('❌ ESM Node.js failed');
}

console.log('✅ ESM Node.js works!');
