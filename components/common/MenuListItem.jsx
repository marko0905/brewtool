// brewtool/components/common/MenuListItem.jsx

import { Box, Text } from 'ink';

export default function MenuListItem({
  packageName = '', 
  packageVersion = '', 
  updateAvailable = false, 
  updateVersion = '', 
  listItemFocused = false, 
  selected = false}) {
  
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
        ) : (
        <Text> </Text>
      )}
      <Text>|</Text>
      {selected ?(
        <Text color="rgb(247, 0, 255)">*</Text>
        ) : (
        <Text> </Text>
      )}
      <Text>| </Text>
      {updateAvailable ? (
        <Text color="rgb(0, 196, 13)">{packageName}</Text>
        ) : (
        <Text color="rgb(255, 166, 0)">{packageName}</Text>
        )}
      <Text> | </Text>
      {updateAvailable ? (
        <Text color="rgb(0, 196, 13)">{packageVersion}</Text>
        ) : (
        <Text color="rgb(255, 166, 0)">{packageVersion}</Text>
      )}
      <Text> | </Text>
      {updateAvailable ? (
        <Text color="rgb(0, 196, 13)" >{'->'}</Text>
        ) : (
        <Text color="rgb(255, 166, 0)">{'-x'}</Text>

      )}
      <Text> | </Text>
      {updateAvailable ? (
        <Text color="rgb(0, 196, 13)">{updateVersion}</Text>
        ) : (
        <Text color="rgb(255, 166, 0)">{packageVersion}</Text>
      )}
      <Text> |</Text>
    </Box>
  );
}