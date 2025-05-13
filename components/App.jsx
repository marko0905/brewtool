// brewtool/components/App.jsx

import { spawn } from 'child_process';
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
  
  // Added states to track search mode in panels
  const [searchPanelIsSearching, setSearchPanelIsSearching] = useState(false);
  const [mainPanelIsSearching, setMainPanelIsSearching] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);

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
    // Check if any panel is in search mode or has an operation in progress
    const anySearchActive = searchPanelIsSearching || mainPanelIsSearching;
    const anyOperationInProgress = operationInProgress;
    
    // Only allow panel switching when not in search mode and no operation in progress
    if (!anySearchActive && !anyOperationInProgress) {
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
        setIsSearchingGlobal={setSearchPanelIsSearching}
        setOperationInProgressGlobal={setOperationInProgress}
      />

      <MainPanel 
        focused={focused_m}
        refreshTrigger={refreshTrigger}
        setIsSearchingGlobal={setMainPanelIsSearching}
        setOperationInProgressGlobal={setOperationInProgress}
      />

      <BrewfilePanel 
        focused={focused_b}
        refreshTrigger={refreshTrigger}
        setOperationInProgressGlobal={setOperationInProgress}
      />
      <CommandBar
        focused_s={focused_s}
        focused_m={focused_m}
        focused_b={focused_b}
      />
    </Box>
  );
}