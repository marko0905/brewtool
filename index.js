// brewtool/index.js

import { main } from './services/startup.js';

// Start the application
main().catch(error => {
  console.error('Error during startup:', error);
  process.exit(1);
});