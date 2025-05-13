// brewtool/services/startup.js

import { spawn } from 'child_process';
import fs from 'fs';
import { render } from 'ink';
import os from 'os';
import path from 'path';
import React from 'react';
import App from '../components/App.jsx';

// Function to validate sudo password
function validateSudoPassword(password) {
  return new Promise((resolve) => {
    const sudo = spawn('sudo', ['-S', 'true']);
    
    // Handle password incorrect
    sudo.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('incorrect password')) {
        resolve(false);
      }
    });
    
    // Write password to sudo process
    sudo.stdin.write(password + '\n');
    sudo.stdin.end();
    
    // Check exit code
    sudo.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

// Function to ask for password
function askForPassword() {
  process.stdout.write('BrewTool requires sudo privileges for some operations.\n');
  process.stdout.write('Please enter your sudo password: ');
  
  // Use raw mode for password input
  const isRawModeSupported = process.stdin.isTTY;
  if (isRawModeSupported) {
    process.stdin.setRawMode(true);
  }
  
  let password = '';
  
  return new Promise((resolve) => {
    const onData = (key) => {
      const keyString = key.toString();
      
      // Ctrl+C
      if (keyString === '\u0003') {
        process.stdout.write('\n');
        process.exit(0);
      }
      
      // Enter key
      if (keyString === '\r' || keyString === '\n') {
        if (isRawModeSupported) {
          process.stdin.setRawMode(false);
          process.stdin.removeListener('data', onData);
        }
        process.stdout.write('\n');
        resolve(password);
        return;
      }
      
      // Backspace
      if (keyString === '\b' || keyString === '\x7f') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          if (isRawModeSupported) {
            process.stdout.write('\b \b'); // Erase the last character
          }
        }
        return;
      }
      
      // Add character to password
      if (keyString.length === 1 && !keyString.match(/[\x00-\x1F]/)) { // Skip control characters
        password += keyString;
        if (isRawModeSupported) {
          process.stdout.write('*'); // Only write the asterisk, not the character
        }
      }
    };
    
    process.stdin.on('data', onData);
  });
}

// Create an askpass script that will echo the password
function createAskpassScript(password) {
  const tempDir = os.tmpdir();
  const scriptPath = path.join(tempDir, 'brewtool-askpass');
  
  // Create a script that outputs the password
  const scriptContent = `#!/bin/bash
echo "${password}"
`;
  
  fs.writeFileSync(scriptPath, scriptContent, {mode: 0o700}); // Make executable
  
  return scriptPath;
}

// Main function
async function main() {
  let authenticated = false;
  let password = '';
  let attempts = 0;
  
  while (!authenticated && attempts < 3) {
    attempts++;
    password = await askForPassword();
    authenticated = await validateSudoPassword(password);
    
    if (!authenticated) {
      process.stdout.write('Incorrect password. Please try again.\n');
    }
  }
  
  if (!authenticated) {
    process.stdout.write('Authentication failed after 3 attempts. Exiting.\n');
    process.exit(1);
  }
  
  // Create askpass script
  const askpassPath = createAskpassScript(password);
  
  // Set SUDO_ASKPASS environment variable
  process.env.SUDO_ASKPASS = askpassPath;
  
  // Setup clean exit handler
  const cleanExit = () => {
    process.stdout.write('\nExiting BrewTool and cleaning up...\n');
    
    // Remove the askpass script
    try {
      fs.unlinkSync(askpassPath);
    } catch (error) {
      console.error('Error removing askpass script:', error);
    }
    
    process.exit(0);
  };
  
  // Listen for exit signals
  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);
  
  // Clear the console before rendering
  console.clear();
  
  // Render the application
  render(<App />);
}

// Export the main function
export { main };
