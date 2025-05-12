// brewtool/components/MainPanel.jsx

import { Box, Text, useInput } from 'ink';
import { useEffect, useState } from 'react';

import { getInstalledPackages, uninstallPackage, updateAllPackages, updatePackage } from '../services/brewServices.js';
import { useTerminalDimensions } from '../utils/hooks';
import MenuListItem from './common/MenuListItem';
import MenuListItemAll from './common/MenuListItemAll';
import MenuListSearch from './common/MenuListSearch';
import MenuPlaceholder from './common/MenuPlaceholder';

export default function MainPanel({ focused = false, refreshTrigger = 0 }) {
  const [tWidth, tHeight] = useTerminalDimensions();
  const isFocused = focused;
  
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedPackages, setSelectedPackages] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPackages, setFilteredPackages] = useState([]);
  
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [operationStatus, setOperationStatus] = useState(null);

  const mPanelHeight = Math.max(Math.floor(tHeight * 0.75), 5);
  
  const visibleItems = Math.max(mPanelHeight - 3, 1);
  
  useEffect(() => {
    fetchPackages();
  }, [refreshTrigger]);
  
  async function fetchPackages() {
    try {
      setLoading(true);
      const installedPackages = await getInstalledPackages();
      setPackages(installedPackages);
      setFilteredPackages(installedPackages);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load packages');
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPackages(packages);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = packages.filter(pkg => 
      pkg.name.toLowerCase().includes(query)
    );
    
    setFilteredPackages(filtered);
    
    setSelectedIndex(0);
    setStartIndex(0);
  }, [searchQuery, packages]);

  const resetSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    setFilteredPackages(packages);
  };

  useEffect(() => {
    if (selectedIndex < startIndex) {
      setStartIndex(selectedIndex);
    } else if (selectedIndex >= startIndex + visibleItems) {
      setStartIndex(selectedIndex - visibleItems + 1);
    }
  }, [selectedIndex, startIndex, visibleItems]);

  useEffect(() => {
    if (operationStatus) {
      const timer = setTimeout(() => {
        setOperationStatus(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [operationStatus]);

  const handleUpdate = async () => {
    const updatableSelectedPackages = new Set(
      [...selectedPackages].filter(packageName => {
        const pkg = packages.find(p => p.name === packageName);
        return pkg && pkg.outdated;
      })
    );
    
    if (updatableSelectedPackages.size === 0 && !selectAll) {
      setOperationStatus({ success: false, message: 'No updatable packages selected' });
      return;
    }
    
    setOperationInProgress(true);
    setOperationStatus({ message: 'Updating packages...' });
    
    try {
      let result;
      
      if (selectAll) {
        result = await updateAllPackages();
      } else {
        const updateResults = [];
        
        for (const packageName of updatableSelectedPackages) {
          const packageResult = await updatePackage(packageName);
          updateResults.push(packageResult);
        }
        
        const allSucceeded = updateResults.every(r => r.success);
        result = {
          success: allSucceeded,
          message: allSucceeded 
            ? `Successfully updated ${updateResults.length} package(s)`
            : 'Some packages failed to update'
        };
      }
      
      setOperationStatus(result);
      
      if (result.success) {
        setSelectedPackages(new Set());
        setSelectAll(false);
        
        await fetchPackages();
      }
    } catch (err) {
      setOperationStatus({ 
        success: false, 
        message: `Update failed: ${err.message || 'Unknown error'}` 
      });
    } finally {
      setOperationInProgress(false);
    }
  };
  
  const handleDelete = async () => {
    if (selectAll) {
      setOperationStatus({ 
        success: false, 
        message: 'Please select specific packages to delete instead of "Select All"' 
      });
      return;
    }
    
    if (selectedPackages.size === 0) {
      setOperationStatus({ success: false, message: 'No packages selected for deletion' });
      return;
    }
    
    setOperationInProgress(true);
    setOperationStatus({ message: 'Uninstalling packages...' });
    
    try {
      const deleteResults = [];
      
      for (const packageName of selectedPackages) {
        const packageResult = await uninstallPackage(packageName);
        deleteResults.push(packageResult);
      }
      
      const allSucceeded = deleteResults.every(r => r.success);
      const result = {
        success: allSucceeded,
        message: allSucceeded 
          ? `Successfully uninstalled ${deleteResults.length} package(s)`
          : 'Some packages failed to uninstall'
      };
      
      setOperationStatus(result);
      
      if (result.success) {
        setSelectedPackages(new Set());
        setSelectAll(false);
        
        await fetchPackages();
      }
    } catch (err) {
      setOperationStatus({ 
        success: false, 
        message: `Uninstall failed: ${err.message || 'Unknown error'}` 
      });
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  useInput((input, key) => {
    if (!isFocused || operationInProgress) return;
    
    if (key.escape) {
      resetSearch();
      return;
    }
    
    if (input === '/' && !isSearching) {
      setIsSearching(true);
      setSearchQuery('');
      return;
    }
    
    if (isSearching) {
      if (key.return) {
        if (filteredPackages.length === 0) {
          return;
        }
        setIsSearching(false);
      }
      return;
    }
    
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      const maxIndex = filteredPackages.length;
      setSelectedIndex(prev => Math.min(maxIndex, prev + 1));
    }
    
    if (input === ' ') {
      if (selectedIndex === 0) {
        setSelectAll(prev => !prev);
        if (!selectAll) {
          const updatablePackages = filteredPackages
            .filter(pkg => pkg.outdated)
            .map(pkg => pkg.name);
          setSelectedPackages(new Set(updatablePackages));
        } else {
          setSelectedPackages(new Set());
        }
      } else if (selectedIndex > 0 && selectedIndex <= filteredPackages.length) {
        const packageIndex = selectedIndex - 1;
        const packageName = filteredPackages[packageIndex].name;
        
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
    
    if (input === 'u') {
      handleUpdate();
    }
    
    if (input === 'd') {
      handleDelete();
    }
  });
  
  const renderScrollBar = () => {
    const totalItems = filteredPackages.length + 1;
    
    if (totalItems <= visibleItems) {
      return [];
    }
    
    const scrollBarItems = [];
    
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
  
  const scrollBarItems = !loading && filteredPackages.length > 0 ? renderScrollBar() : [];
  const hasNoSearchResults = searchQuery !== '' && filteredPackages.length === 0;
  
  const styles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      width: tWidth,
      height: mPanelHeight,
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
      height: mPanelHeight - 1,
      minHeight: 3,
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
      height: mPanelHeight - 1,
      minHeight: 3,
      borderStyle: 'round',
      borderColor: 'rgb(0, 196, 13)',
      borderWidth: 1,
      paddingLeft: 1,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
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
    noResultsMessage: {
      color: 'yellow',
      marginTop: 1,
    },
    helpText: {
      color: 'blue',
      marginTop: 1,
    },
  };

  return (
    <Box {...styles.wrapper}>
      <Box {...styles.titleContainer}>
        <Text {...(isFocused ? styles.titleText_focused : styles.titleText)}>{'[2 - Main]'}</Text>
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
        {loading ? (
          <MenuPlaceholder loadingPackages={true} packagesFound={true} />
        ) : error ? (
          <Text color="red">Error: {error}</Text>
        ) : packages.length === 0 ? (
          <MenuPlaceholder loadingPackages={false} packagesFound={false} />
        ) : (
          <>
            {(isSearching || hasNoSearchResults) && (
              <Box {...styles.listItemBox}>
                <MenuListSearch 
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </Box>
            )}
            
            {hasNoSearchResults && (
              <Box flexDirection="column" marginTop={1}>
                <Text {...styles.noResultsMessage}>
                  No packages match the search "{searchQuery}"
                </Text>
                <Text {...styles.helpText}>
                  Press ESC to reset search or modify your search terms
                </Text>
              </Box>
            )}
            
            {!hasNoSearchResults && (
              Array.from({ length: visibleItems - (isSearching ? 1 : 0) }).map((_, i) => {
                const itemIndex = startIndex + i;
                
                if (itemIndex === 0) {
                  return (
                    <Box key="select-all" {...styles.listItemBox}>
                      <Box flexGrow={1}>
                        <MenuListItemAll 
                          listItemFocused={selectedIndex === 0 && !isSearching}
                          selectedAll={selectAll}
                        />
                      </Box>
                      {scrollBarItems && scrollBarItems.length > 0 && (
                        <Text color="blue">
                          {i < scrollBarItems.length && scrollBarItems[i] ? '|*|' : '| |'}
                        </Text>
                      )}
                    </Box>
                  );
                }
                
                const packageIndex = itemIndex - 1;
                if (packageIndex >= 0 && packageIndex < filteredPackages.length) {
                  const pkg = filteredPackages[packageIndex];
                  return (
                    <Box key={pkg.name} {...styles.listItemBox}>
                      <Box flexGrow={1}>
                        <MenuListItem
                          packageName={pkg.name}
                          packageVersion={pkg.version}
                          updateAvailable={pkg.outdated}
                          updateVersion={pkg.newVersion}
                          listItemFocused={selectedIndex === itemIndex && !isSearching}
                          selected={selectedPackages.has(pkg.name)}
                        />
                      </Box>
                      {scrollBarItems && scrollBarItems.length > 0 && (
                        <Text color="blue">
                          {i < scrollBarItems.length && scrollBarItems[i] ? '|*|' : '| |'}
                        </Text>
                      )}
                    </Box>
                  );
                }
                
                return null;
              })
            )}
          </>
        )}
      </Box>
    </Box>
  );
}