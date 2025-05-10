// brewtool/components/common/BrewfileStates.jsx

import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import React, { useEffect, useState } from 'react';

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
    <box {...styles.brewFileBox}>
      {loading_bf===true && (<Text>Loading ...</Text>)}
      {loading_bf===false && (
        brewFileLocated === true ? (
          <Text color="green">Brewfile located</Text>
        ) : (
          <Text color="red">Brewfile not located</Text>
        )
      )}
      <Text> </Text>
      {loading_bf===false && (
        update_bf=== true ? (
          <Text color="rgb(0, 196, 13)">Brewfile up to date</Text>
        ) : (
          <Text color="rgb(255, 166, 0)">Brewfile update needed !!!</Text>
        )
      )}
    </box>
  );
}