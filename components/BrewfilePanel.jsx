// brewtool/components/BrewfilePanel.jsx

import { Box, Text, useInput } from 'ink';
import React, { useEffect, useState } from 'react';

import {
  BREWFILE_PATH,
  checkBrewfileExists,
  createBrewfile,
  getBrewfileSyncChanges,
  getSymlinkTarget,
  installFromBrewfile,
  isBrewfileUpToDate,
  isSymlink,
  updateBrewfile
} from '../services/fileService.js';
import { useTerminalDimensions } from '../utils/hooks.js';
import BrewfileStates from './common/BrewfileStates.jsx';

export default function BrewfilePanel({ focused = false, refreshTrigger = 0 }) {
  const isFocused = focused;
  const [tWidth, tHeight] = useTerminalDimensions();
  
  const [loading, setLoading] = useState(true);
  const [brewfileExists, setBrewfileExists] = useState(false);
  const [brewfileUpToDate, setBrewfileUpToDate] = useState(false);
  const [isSymlinked, setIsSymlinked] = useState(false);
  const [symlinkTarget, setSymlinkTarget] = useState('');
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [operationStatus, setOperationStatus] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const bPanelHeight = Math.max(Math.floor(tHeight * 0.1), 3);
  
  // Check brewfile status on initial load, when panel is focused, or when refreshTrigger changes
  useEffect(() => {
    checkBrewfileStatus();
  }, [focused, refreshTrigger]);
  
  // Reset operation status after delay
  useEffect(() => {
    if (operationStatus) {
      const timer = setTimeout(() => {
        setOperationStatus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [operationStatus]);
  
  async function checkBrewfileStatus() {
    try {
      setLoading(true);
      
      // Check if brewfile exists
      const exists = await checkBrewfileExists();
      setBrewfileExists(exists);
      
      // If it exists, check if it's a symlink
      if (exists) {
        const symlinked = await isSymlink(BREWFILE_PATH);
        setIsSymlinked(symlinked);
        
        if (symlinked) {
          const target = await getSymlinkTarget(BREWFILE_PATH);
          setSymlinkTarget(target || '');
        }
        
        // Check if it's up to date regardless of whether it's a symlink
        const upToDate = await isBrewfileUpToDate();
        setBrewfileUpToDate(upToDate);
      } else {
        setIsSymlinked(false);
        setSymlinkTarget('');
      }
    } catch (err) {
      console.error('Error checking brewfile status:', err);
    } finally {
      setLoading(false);
    }
  }
  
  // Create brewfile
  async function handleCreateBrewfile() {
    if (operationInProgress) return;
    
    try {
      setOperationInProgress(true);
      setOperationStatus({ message: 'Creating Brewfile...' });
      
      const result = await createBrewfile();
      setOperationStatus(result);
      
      if (result.success) {
        await checkBrewfileStatus();
      }
    } catch (err) {
      setOperationStatus({ 
        success: false, 
        message: `Failed to create Brewfile: ${err.message || 'Unknown error'}`
      });
    } finally {
      setOperationInProgress(false);
    }
  }
  
  // Update brewfile
  async function handleUpdateBrewfile() {
    if (operationInProgress) return;
    
    // If it's a symlink, warn user before updating
    if (isSymlinked) {
      setOperationStatus({
        success: false,
        message: `Warning: Brewfile is a symlink to ${symlinkTarget}. Update with caution.`
      });
      
      // Wait for warning to be shown before proceeding
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    try {
      setOperationInProgress(true);
      setOperationStatus({ message: 'Updating Brewfile...' });
      
      const result = await updateBrewfile();
      setOperationStatus(result);
      
      if (result.success) {
        await checkBrewfileStatus();
      }
    } catch (err) {
      setOperationStatus({ 
        success: false, 
        message: `Failed to update Brewfile: ${err.message || 'Unknown error'}`
      });
    } finally {
      setOperationInProgress(false);
    }
  }
  
  // Check for changes that would happen from reinstalling
  async function checkBrewfileChanges() {
    if (operationInProgress || !brewfileExists) return;
    
    try {
      setOperationInProgress(true);
      setOperationStatus({ message: 'Analyzing brewfile changes...' });
      
      const changes = await getBrewfileSyncChanges();
      setPendingChanges(changes);
      
      if (changes.toInstall.length === 0 && changes.toRemove.length === 0) {
        setOperationStatus({ 
          success: true, 
          message: 'System already matches brewfile - no changes needed' 
        });
        setShowConfirmation(false);
      } else {
        setShowConfirmation(true);
        setOperationStatus({ 
          message: `Will install ${changes.toInstall.length} and remove ${changes.toRemove.length} package(s). Press 'i' again to confirm.` 
        });
      }
    } catch (err) {
      setOperationStatus({ 
        success: false, 
        message: `Failed to analyze brewfile changes: ${err.message || 'Unknown error'}`
      });
    } finally {
      setOperationInProgress(false);
    }
  }
  
  // Install packages from brewfile
  async function handleInstallFromBrewfile() {
    if (operationInProgress) return;
    
    if (!brewfileExists) {
      setOperationStatus({ 
        success: false, 
        message: 'No brewfile found. Create one with \'c\' or add your own to ~/.config/brewtool/' 
      });
      return;
    }
    
    // If we haven't shown confirmation yet, check changes first
    if (!showConfirmation) {
      await checkBrewfileChanges();
      return;
    }
    
    // User has confirmed, proceed with installation
    try {
      setShowConfirmation(false);
      setOperationInProgress(true);
      setOperationStatus({ message: 'Syncing system with brewfile...' });
      
      const result = await installFromBrewfile(false);
      
      // Add details about what was installed/removed to the message
      let detailedMessage = result.message;
      
      if (result.installed.length > 0 || result.removed.length > 0) {
        detailedMessage += '\n';
        
        if (result.installed.length > 0) {
          detailedMessage += `\nInstalled: ${result.installed.join(', ')}`;
        }
        
        if (result.removed.length > 0) {
          detailedMessage += `\nRemoved: ${result.removed.join(', ')}`;
        }
      }
      
      setOperationStatus({
        success: result.success,
        message: detailedMessage
      });
      
      if (result.success) {
        await checkBrewfileStatus();
      }
    } catch (err) {
      setOperationStatus({ 
        success: false, 
        message: `Failed to sync with brewfile: ${err.message || 'Unknown error'}`
      });
    } finally {
      setOperationInProgress(false);
    }
  }
  
  // Handle keyboard input
  useInput((input, key) => {
    if (!isFocused) return;
    
    if (operationInProgress) return;
    
    if (showConfirmation) {
      // If confirmation is showing, any key other than 'i' cancels
      if (input !== 'i') {
        setShowConfirmation(false);
        setPendingChanges(null);
        setOperationStatus(null);
      } else {
        handleInstallFromBrewfile();
      }
      return;
    }
    
    if (input === 'c') {
      handleCreateBrewfile();
    } else if (input === 'u') {
      handleUpdateBrewfile();
    } else if (input === 'i') {
      handleInstallFromBrewfile();
    }
  });
  
  const styles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: tWidth,
      height: bPanelHeight,
      minHeight: 2,
    },
    titleContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'left',
      alignItems: 'center',
      width: tWidth,
      height: 1,
      color: 'white',
      borderWidth: 1,
      paddingLeft: 1,
    },
    titleText: {
      color: 'rgb(255, 255, 255)',
    },
    titleText_focused: {
      color: 'rgb(0, 196, 13)',
    },
    brewfileContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      width: tWidth,
      height: bPanelHeight - 1,
      minHeight: 1,
      borderStyle: 'round',
      borderColor: 'white',
      color: 'white',
      borderWidth: 1,
      padding: 0.5,
      paddingLeft: 1,
    },
    brewfileContainer_focused: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      width: tWidth,
      height: bPanelHeight - 1,
      minHeight: 1,
      borderStyle: 'round',
      borderColor: 'rgb(0, 196, 13)',
      borderWidth: 1,
      padding: 0.5,
      paddingLeft: 1,
    },
    statusMessage: {
      paddingLeft: 1,
      color: 'yellow',
      fontWeight: 'bold',
    },
    statusSuccess: {
      paddingLeft: 1,
      color: 'green',
      fontWeight: 'bold',
    },
    statusError: {
      paddingLeft: 1,
      color: 'red',
      fontWeight: 'bold',
    },
  };

  return (
    <Box {...styles.wrapper}>
      <Box {...styles.titleContainer}>
        <Text {...(isFocused ? styles.titleText_focused : styles.titleText)}>
          {'[3 - Brewfile]'}
        </Text>
        {operationStatus && (
          <Text
            {...(
              operationStatus.success === undefined
                ? styles.statusMessage
                : operationStatus.success
                  ? styles.statusSuccess
                  : styles.statusError
            )}
          >
            {operationStatus.message}
          </Text>
        )}
      </Box>
      <Box {...(isFocused ? styles.brewfileContainer_focused : styles.brewfileContainer)}>
        <Text>Looking for brewfile in: {BREWFILE_PATH}</Text>
        <BrewfileStates
          loading_bf={loading}
          brewFileLocated={brewfileExists}
          update_bf={brewfileUpToDate}
          isSymlinked={isSymlinked}
          symlinkTarget={symlinkTarget}
        />
        {isSymlinked && symlinkTarget && (
          <Text dimColor italic>Symlinked from: {symlinkTarget}</Text>
        )}
        
        {showConfirmation && pendingChanges && (
          <Box flexDirection="column" marginTop={1}>
            {pendingChanges.toInstall.length > 0 && (
              <Text color="green">
                Packages to install ({pendingChanges.toInstall.length}): {pendingChanges.toInstall.join(', ')}
              </Text>
            )}
            
            {pendingChanges.toRemove.length > 0 && (
              <Text color="red">
                Packages to remove ({pendingChanges.toRemove.length}): {pendingChanges.toRemove.join(', ')}
              </Text>
            )}
            
            <Text color="yellow" bold>Press 'i' again to confirm or any other key to cancel</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}