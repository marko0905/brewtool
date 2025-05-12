// brewtool/components/common/MenuListItemAll.jsx

import { Box, Text } from 'ink';

export default function MenuListItemAll({loadingPackages = true, packagesFound = true}) {
  
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
      {loadingPackages === true &&(
        <Text>Loading ...</Text>
      )}
      {packagesFound===false && (
        <Text color="rgb(255, 0, 0)">No packages Found</Text>
      )}
    </Box>
  );
}
