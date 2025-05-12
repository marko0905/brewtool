// brewtool/components/App.jsx

import { Box, useInput } from 'ink';
import { useEffect, useState } from 'react';

import { updateHomebrew } from '../services/brewServices.js';
import { useTerminalDimensions } from '../utils/hooks';
import BrewfilePanel from './BrewfilePanel';
import CommandBar from './CommandBar';
import MainPanel from './MainPanel';
import SearchPanel from './SearchPanel';

export default function App() {
  const [tWidth, tHeight] = useTerminalDimensions();
  const [focused_s, setFocused_s] = useState(true);
  const [focused_m, setFocused_m] = useState(false);
  const [focused_b, setFocused_b] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshPackages = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const performInitialUpdate = async () => {
      try {
        await updateHomebrew();
      } catch (error) {
        console.error("Failed to update Homebrew:", error);
      }
    };

    performInitialUpdate();
  }, []);

  useInput((input, key) => {
    if (input === '1') {
      setFocused_s(true);
      setFocused_m(false);
      setFocused_b(false);
    } else if (input === '2') {
      setFocused_s(false);
      setFocused_m(true);
      setFocused_b(false);
    } else if (input === '3') {
      setFocused_s(false);
      setFocused_m(false);
      setFocused_b(true);
    }
    if (input === 'q') {
      console.clear();
      process.exit(0);
    }
  });
  
  const styles = {
    mainScreen: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: tWidth,
      height: tHeight,
      padding: 0
    }
  };

  return (
    <Box 
      {...styles.mainScreen}
    >
      <SearchPanel 
        focused={focused_s}
        refreshPackages={refreshPackages}
      />

      <MainPanel 
        focused={focused_m}
        refreshTrigger={refreshTrigger}
      />

      <BrewfilePanel 
        focused={focused_b}
        refreshTrigger={refreshTrigger}
      />
      <CommandBar
        focused_s={focused_s}
        focused_m={focused_m}
        focused_b={focused_b}
      />

    </Box>
  );
}