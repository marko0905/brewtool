// brewtool/components/BrewfilePanel.jsx

import { Box, Text, useApp, useInput } from 'ink';
import React, { useEffect, useState } from 'react';

import { useTerminalDimensions } from '../utils/hooks.js';

export default function BrewfilePanel({ focused = false }) {
  const isFocused = focused;
  const [tWidth, tHeight] = useTerminalDimensions();

  const bPanelHeight = Math.max(Math.floor(tHeight * 0.1), 3);
  
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
      flexDirection: 'row',
      justifyContent: 'left',
      alignItems: 'center',
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
      flexDirection: 'row',
      justifyContent: 'left',
      alignItems: 'center',
      width: tWidth,
      height: bPanelHeight - 1,
      minHeight: 1,
      borderStyle: 'round',
      borderColor: 'rgb(0, 196, 13)',
      borderWidth: 1,
      padding: 0.5,
      paddingLeft: 1,
    }
  };

  return (
    <Box {...styles.wrapper}>
      <Box {...styles.titleContainer}>
        <Text {...(isFocused ? styles.titleText_focused : styles.titleText)}>
          {'[3 - Brewfile]'}
        </Text>
      </Box>
      <Box {...(isFocused ? styles.brewfileContainer_focused : styles.brewfileContainer)}>
        <Text>No brewfile</Text>
      </Box>
    </Box>
  );
}