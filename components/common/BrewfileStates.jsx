// brewtool/components/common/BrewfileStates.jsx

import { Box, Text } from 'ink';

export default function BrewfileStates({loading_bf = false, brewFileLocated = false, update_bf = false}) {

  const styles = {
    brewFileBox: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: '100%',
      height: 1,
    },
  };

  return (
    <Box {...styles.brewFileBox}>
      {loading_bf===true && (<Text>Loading ...</Text>)}
      {loading_bf===false && (
        brewFileLocated === true ? (
          <>
            <Text color="green">Brewfile located</Text>
            <Text> </Text>
            {update_bf === true ? (
              <Text color="rgb(0, 196, 13)">Brewfile up to date</Text>
            ) : (
              <Text color="rgb(255, 166, 0)">Brewfile out of sync - press 'u' to update</Text>
            )}
          </>
        ) : (
          <Text color="rgb(255, 166, 0)">No brewfile found - press 'c' to create one</Text>
        )
      )}
    </Box>
  );
}