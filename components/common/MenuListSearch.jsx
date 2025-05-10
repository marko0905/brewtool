// brewtool/components/common/MenuListSearch.jsx

import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import React from 'react';

export default function MenuListSearch({ value = '', onChange = () => {} }) {

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

  const handleChange = (newValue) => {
    onChange(newValue);
  };

  return (
    <Box {...styles.listItemBox}>
      <Text>&gt; </Text>
      <TextInput
        value={value}
        onChange={handleChange}
        placeholder="Search packages..."
        focus={true}
      />
    </Box>
  );
}