// brewtool/utils/hooks.js

import { useStdin } from 'ink';
import { useEffect, useState } from 'react';

/**
 * Custom hook to get terminal dimensions
 * This replaces the functionality of ink-use-stdout-dimensions
 * @returns {Array} [width, height] - Terminal dimensions
 */
export function useTerminalDimensions() {
  const { stdin } = useStdin();
  const [dimensions, setDimensions] = useState([process.stdout.columns || 80, process.stdout.rows || 24]);
  
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions([
        process.stdout.columns || 80,
        process.stdout.rows || 24
      ]);
    };

    updateDimensions();

    if (stdin && stdin.on) {
      process.stdout.on('resize', updateDimensions);
      
      return () => {
        process.stdout.removeListener('resize', updateDimensions);
      };
    }
  }, [stdin]);

  return dimensions;
}