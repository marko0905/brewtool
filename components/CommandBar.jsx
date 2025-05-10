// brewtool/components/CommandBar.jsx

import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import React, { useEffect, useState } from 'react';
import { useTerminalDimensions } from '../utils/hooks.js';

export default function CommandBar({ focused_s = false, focused_m = false, focused_b = false }) {
  const [tWidth, tHeight] = useTerminalDimensions();

  const commandBarHeight = Math.max(Math.floor(tHeight * 0.05), 1);

  const styles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: tWidth,
      height: commandBarHeight,
      minHeight: 1,
      paddingLeft: 1,
    },
    commandBar: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'left',
      flexWrap: 'wrap',
      alignItems: 'center',
      width: tWidth,
      height: commandBarHeight,
      minHeight: 1,
    }
  };

  return (
    <Box {...styles.wrapper}>
      {focused_s && (
        <Box {...styles.commandBar}>
          <Text backgroundColor="rgb(0, 10, 196)">|Quit - q|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 13, 255)">|Start search - /|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 10, 196)">|End Search - esc|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 13, 255)">|Search - enter|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 10, 196)">|Select - space|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 13, 255)">|Navigate - ↑↓|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 10, 196)">|Install - i|</Text>
        </Box>
      )}
      
      {focused_m && (
        <Box {...styles.commandBar}>
          <Text backgroundColor="rgb(0, 10, 196)">|Quit - q|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 13, 255)">|Navigate - ↑↓|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 10, 196)">|Select - space|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 13, 255)">|Update - u|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 10, 196)">|Delete - d|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 13, 255)">|Start search - /|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 10, 196)">|Search - enter|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 13, 255)">|Exit search - esc|</Text>
          <Text> </Text>
        </Box>
      )}
      
      {focused_b && (
        <Box {...styles.commandBar}>
          <Text backgroundColor="rgb(0, 10, 196)">|Quit - q|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 13, 255)">|Create Brewfile - c|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 10, 196)">|Import - i|</Text>
          <Text> </Text>
          <Text backgroundColor="rgb(0, 13, 255)">|Update - u|</Text>
        </Box>
      )}
    </Box>
  );
}