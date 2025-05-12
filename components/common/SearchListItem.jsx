// brewtool/components/common/SearchListItem.jsx

import { Box, Text } from 'ink';
import { useTerminalDimensions } from '../../utils/hooks.js';

export default function SearchListItem({
  searchItemFocused = false, 
  searchItemSelected = false, 
  searchItemName = '', 
  searchItemDescription = ''}) {
  
  const [tWidth] = useTerminalDimensions();
  
  const nameWidth = searchItemName.length;
  const maxDescWidth = Math.max(tWidth - nameWidth - 20, 20);
  
  const truncatedDescription = searchItemDescription && searchItemDescription.length > maxDescWidth
    ? searchItemDescription.substring(0, maxDescWidth - 3) + '...'
    : searchItemDescription;
  
  const styles = {
    listItemBox: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: '100%',
      height: 1,
    },
    name: {
      color: searchItemFocused ? 'rgb(0, 196, 13)' : 'white',
      bold: searchItemFocused,
    },
    description: {
      color: 'gray',
      italic: true,
    }
  };

  return (
    <Box {...styles.listItemBox}>
      <Text>|</Text>
      {searchItemFocused ? (
        <Text color="rgb(0, 196, 13)">→</Text>
        ) : (
        <Text> </Text>
      )}
      <Text>|</Text>
      {searchItemSelected ? (
        <Text color="rgb(247, 0, 255)">*</Text>
        ) : (
          <Text> </Text>
      )}
      <Text>| </Text>
      <Text {...styles.name}>{searchItemName}</Text>
      <Text> | </Text>
      <Text {...styles.description}>{truncatedDescription || "No description available"}</Text>
      <Text> |</Text>
    </Box>
  );
}