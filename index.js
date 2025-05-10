import { render } from 'ink';
import React from 'react';
import App from './components/App.jsx';

// Make sure React is properly initialized
const main = () => {
  // Clear the console before rendering
  console.clear();
  // Render the main application component
  render(<App />);
};

main();