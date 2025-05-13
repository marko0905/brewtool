// brewtool/components/common/PasswordModule.jsx

import { Box, Text, useInput } from 'ink';
import { useEffect, useState } from 'react';
import { useTerminalDimensions } from '../../utils/hooks.js';

export default function PasswordModule({
  isVisible = false,
  onSubmit = () => {},
  onCancel = () => {},
  operationName = 'operation'
}) {
  const [tWidth, tHeight] = useTerminalDimensions();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Clear password when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setPassword('');
      setErrorMessage('');
    }
  }, [isVisible]);

  useInput((input, key) => {
    if (!isVisible) return;
    
    // Handle ESC to cancel
    if (key.escape) {
      onCancel();
      return;
    }
    
    // Handle Enter to submit
    if (key.return) {
      if (password.length > 0) {
        onSubmit(password);
      } else {
        setErrorMessage('Password cannot be empty');
      }
      return;
    }
    
    // Handle backspace
    if (key.backspace || key.delete) {
      setPassword(prev => prev.slice(0, -1));
      return;
    }
    
    // Add character to password (if not a control key)
    if (input && input.length === 1 && !key.ctrl && !key.meta) {
      setPassword(prev => prev + input);
      setErrorMessage('');
    }
  });
  
  if (!isVisible) return null;
  
  // Calculate modal dimensions
  const modalWidth = Math.min(Math.floor(tWidth * 0.8), 60);
  const modalHeight = 7;
  
  // Calculate position to center the modal
  const leftOffset = Math.floor((tWidth - modalWidth) / 2);
  const topOffset = Math.floor((tHeight - modalHeight) / 2);
  
  const styles = {
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: tWidth,
      height: tHeight,
      backgroundColor: 'black',
      opacity: 0.8,
      zIndex: 10,
    },
    modal: {
      position: 'absolute',
      top: topOffset,
      left: leftOffset,
      width: modalWidth,
      height: modalHeight,
      backgroundColor: 'black',
      borderStyle: 'round',
      borderColor: 'cyan',
      padding: 1,
      zIndex: 20,
    },
    title: {
      color: 'cyan',
      bold: true,
      marginBottom: 1,
    },
    instruction: {
      marginBottom: 1,
    },
    passwordBox: {
      borderStyle: 'single',
      borderColor: 'white',
      padding: 1,
      marginBottom: 1,
    },
    error: {
      color: 'red',
    },
    help: {
      color: 'gray',
      italic: true,
    }
  };

  return (
    <>
      <Box {...styles.overlay} />
      <Box {...styles.modal} flexDirection="column">
        <Text {...styles.title}>Authentication Required</Text>
        <Text {...styles.instruction}>
          {`The ${operationName} requires sudo privileges. Please enter your password:`}
        </Text>
        
        <Box {...styles.passwordBox}>
          <Text>{password.replace(/./g, '*')}</Text>
        </Box>
        
        {errorMessage && (
          <Text {...styles.error}>{errorMessage}</Text>
        )}
        
        <Text {...styles.help}>Press Enter to submit, ESC to cancel</Text>
      </Box>
    </>
  );
}