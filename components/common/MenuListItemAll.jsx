// brewtool/components/common/MenuListItemAll.jsx

import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import React, { useEffect, useState } from 'react';

export default function MenuListItemAll({listItemFocused = false, selectedAll = false}) {
  
  const styles = {
    listItemBox: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: '100%',
      height: 1,
    },
  };

  return (
    <Box {...styles.listItemBox}>
      <Text>|</Text>
      {listItemFocused ? (
        <Text color="rgb(0, 196, 13)">→</Text>
        ):(
        <Text> </Text>
      )}
      <Text>|</Text>
      {selectedAll ? (
        <Text color="rgb(247, 0, 255)">*</Text>
        ) : (
        <Text> </Text>
        )}
      <Text>|</Text>
      {selectedAll ? (
        <Text color="rgb(0, 196, 13)">Select all ↓</Text>
        ):(
        <Text>Select all ↓</Text>
      )}
      <Text>|</Text>
    </Box>
  );
}
