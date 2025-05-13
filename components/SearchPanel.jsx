// brewtool/components/SearchPanel.jsx

import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useEffect, useState } from 'react';

import { installPackage, searchPackages } from '../services/brewServices.js';
import { useTerminalDimensions } from '../utils/hooks.js';
import MenuPlaceholder from './common/MenuPlaceholder.jsx';
import SearchListItem from './common/SearchListItem.jsx';

export default function SearchPanel({ 
  focused = false, 
  refreshPackages = () => {},
  setIsSearchingGlobal = () => {}, // Added prop for communicating search state to parent
  setOperationInProgressGlobal = () => {} // Added prop for communicating operation state to parent
}) {
  const isFocused = focused;
  const [tWidth, tHeight] = useTerminalDimensions();
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedPackages, setSelectedPackages] = useState(new Set());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [operationStatus, setOperationStatus] = useState(null);
  const [operationInProgress, setOperationInProgress] = useState(false);
  
  const sPanelHeight = Math.max(Math.floor(tHeight * 0.1), 3);
  
  const visibleItems = Math.max(sPanelHeight - 3, 1);
  
  // Update parent component when search state changes
  useEffect(() => {
    setIsSearchingGlobal(isTyping);
  }, [isTyping, setIsSearchingGlobal]);
  
  // Update parent component when operation state changes
  useEffect(() => {
    setOperationInProgressGlobal(operationInProgress);
  }, [operationInProgress, setOperationInProgressGlobal]);
  
  useEffect(() => {
    if (!isFocused) {
      setIsTyping(false);
    }
  }, [isFocused]);
  
  useEffect(() => {
    if (operationStatus && !operationInProgress) {
      const timer = setTimeout(() => {
        setOperationStatus(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [operationStatus, operationInProgress]);
  
  useEffect(() => {
    if (selectedIndex < startIndex) {
      setStartIndex(selectedIndex);
    } else if (selectedIndex >= startIndex + visibleItems) {
      setStartIndex(selectedIndex - visibleItems + 1);
    }
  }, [selectedIndex, startIndex, visibleItems]);
  
  const performSearch = async () => {
    if (!inputValue.trim()) {
      return;
    }
    
    try {
      setIsSearching(true);
      setSearchError(null);
      setOperationStatus({ message: 'Searching...' });
      
      const results = await searchPackages(inputValue);
      
      setSearchResults(results);
      setSelectedIndex(0);
      setStartIndex(0);
      
      if (results.length === 0) {
        setOperationStatus({ success: false, message: 'No packages found' });
      } else {
        setOperationStatus({ success: true, message: `Found ${results.length} packages` });
      }
    } catch (error) {
      setSearchError(error.message || 'Search failed');
      setOperationStatus({ 
        success: false, 
        message: `Search failed: ${error.message || 'Unknown error'}` 
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSubmit = () => {
    if (isTyping && inputValue.trim()) {
      setIsTyping(false);
      performSearch();
    }
  };
  
  const installSelectedPackages = async () => {
    if (selectedPackages.size === 0) {
      setOperationStatus({ success: false, message: 'No packages selected for installation' });
      return;
    }
    
    setOperationInProgress(true);
    setOperationStatus({ message: 'Installing packages...' });
    
    try {
      const installResults = [];
      
      for (const packageName of selectedPackages) {
        const packageResult = await installPackage(packageName);
        installResults.push(packageResult);
      }
      
      const allSucceeded = installResults.every(r => r.success);
      const result = {
        success: allSucceeded,
        message: allSucceeded 
          ? `Successfully installed ${installResults.length} package(s)`
          : 'Some packages failed to install'
      };
      
      setOperationStatus(result);
      
      if (result.success) {
        setSelectedPackages(new Set());
        
        refreshPackages();
      }
    } catch (err) {
      setOperationStatus({ 
        success: false, 
        message: `Installation failed: ${err.message || 'Unknown error'}` 
      });
    } finally {
      setOperationInProgress(false);
    }
  };
  
  const clearSearch = () => {
    setSearchResults([]);
    setSelectedPackages(new Set());
    setSelectedIndex(0);
    setStartIndex(0);
  };
  
  const renderScrollBar = () => {
    if (searchResults.length <= visibleItems) {
      return [];
    }
    
    const scrollBarItems = [];
    const totalItems = searchResults.length;
    
    for (let i = 0; i < visibleItems; i++) {
      const itemPosition = startIndex + i;
      const percentagePosition = itemPosition / totalItems;
      const scrollBarPosition = Math.floor(percentagePosition * visibleItems);
      
      if (scrollBarPosition === i) {
        scrollBarItems.push(true);
      } else {
        scrollBarItems.push(false);
      }
    }
    
    return scrollBarItems;
  };
  
  const scrollBarItems = !isSearching && searchResults.length > 0 ? renderScrollBar() : [];
  
  useInput((input, key) => {
    if (!isFocused || operationInProgress) return;
    
    if (input === '/' && !isTyping) {
      setInputValue('');
      setIsTyping(true);
    } 
    else if (isFocused && isTyping && key.return) {
      handleSubmit();
    } 
    else if (isFocused && isTyping && key.escape) {
      setInputValue('');
      setIsTyping(false);
    }
    else if (isFocused && !isTyping && searchResults.length > 0 && key.escape) {
      clearSearch();
    }
    else if (isFocused && !isTyping && searchResults.length > 0) {
      if (key.upArrow) {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex(prev => Math.min(searchResults.length - 1, prev + 1));
      }
      
      if (input === ' ') {
        const packageName = searchResults[selectedIndex]?.name;
        if (packageName) {
          setSelectedPackages(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(packageName)) {
              newSelected.delete(packageName);
            } else {
              newSelected.add(packageName);
            }
            return newSelected;
          });
        }
      }
      
      if (input === 'i') {
        installSelectedPackages();
      }
    }
  });
  
  const handleChange = (value) => {
    if (isTyping) {
      setInputValue(value);
    }
  };
  
  const styles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      width: tWidth,
      height: sPanelHeight,
      minHeight: 3,
    },
    titleContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'left',
      alignItems: 'center',
      width: '100%',
      height: 1,
      minHeight: 1,
      borderWidth: 1,
      paddingLeft: 1,
    },
    titleText: {
      color: 'rgb(255, 255, 255)',
    },
    titleText_focused: {
      color: 'rgb(0, 196, 13)',
    },
    mainContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      width: tWidth,
      height: sPanelHeight - 1,
      minHeight: 2,
      borderStyle: 'round',
      borderColor: 'white',
      borderWidth: 1,
      paddingLeft: 1,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
    mainContainer_focused: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      width: '100%',
      height: sPanelHeight - 1,
      minHeight: 2,
      borderStyle: 'round',
      borderColor: 'rgb(0, 196, 13)',
      borderWidth: 1,
      paddingLeft: 1,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
    searchBox: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: 1,
    },
    nonFocusedSearchText: {
      color: 'rgb(107, 107, 107)',
    },
    listItemBox: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: 1,
    },
    statusMessage: {
      paddingLeft: 1,
      color: 'yellow',
      fontWeight: 'bold',
    },
    statusSuccess: {
      paddingLeft: 1,
      color: 'green',
      fontWeight: 'bold',
    },
    statusError: {
      paddingLeft: 1,
      color: 'red',
      fontWeight: 'bold',
    },
  };
  
  return (
    <Box {...styles.wrapper}>
      <Box {...styles.titleContainer}>
        <Text {...(isFocused ? styles.titleText_focused : styles.titleText)}>{'[1 - Search]'}</Text>
        {operationStatus && (
          <Text
            {...(
              operationStatus.success === undefined
                ? styles.statusMessage
                : operationStatus.success
                  ? styles.statusSuccess
                  : styles.statusError
            )}
          >
            {operationStatus.message}
          </Text>
        )}
      </Box>
      
      <Box {...(isFocused ? styles.mainContainer_focused : styles.mainContainer)}>
        <Box {...styles.searchBox}>
          <Text>&gt; </Text>
          {isTyping ? (
            <TextInput 
              placeholder='Search for brews...'
              value={inputValue}
              onChange={handleChange}
              onSubmit={handleSubmit}
              focus={true}
            />
          ) : (
            <Text {...styles.nonFocusedSearchText}>
              {isFocused 
                ? 'Press / to search...' 
                : 'Search for brews...'}
            </Text>
          )}
        </Box>
        
        {isSearching ? (
          <MenuPlaceholder loadingPackages={true} packagesFound={true} />
        ) : searchResults.length > 0 ? (
          searchResults
            .slice(startIndex, startIndex + visibleItems)
            .map((pkg, index) => (
              <Box key={pkg.name} {...styles.listItemBox}>
                <Box flexGrow={1}>
                  <SearchListItem
                    searchItemFocused={selectedIndex === startIndex + index}
                    searchItemSelected={selectedPackages.has(pkg.name)}
                    searchItemName={pkg.name}
                    searchItemDescription={pkg.description}
                  />
                </Box>
                {scrollBarItems.length > 0 && (
                  <Text color="blue">
                    {index < scrollBarItems.length && scrollBarItems[index] ? '|*|' : '| |'}
                  </Text>
                )}
              </Box>
            ))
        ) : searchError ? (
          <Text color="red">Error: {searchError}</Text>
        ) : null}
      </Box>
    </Box>
  );
}