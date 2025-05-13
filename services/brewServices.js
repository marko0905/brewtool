// brewtool/services/brewServices.js

/**
 * Service to handle all interactions with Homebrew
 * Provides functions to search, install, update and remove packages
 */

/**
 * Execute a brew command and return the result
 * 
 * @param {string} command - The brew subcommand to execute
 * @param {string[]} args - Arguments for the brew command
 * @returns {Promise<{stdout: string, stderr: string, success: boolean}>}
 */
async function executeBrewCommand(command, args = []) {
  try {
    // These packages are known to require special handling
    const specialPackages = ['parallels', 'virtualbox', 'vmware', 'docker'];
    const isSpecialPackage = 
      args.length > 0 && 
      specialPackages.some(name => args[0].toLowerCase().includes(name.toLowerCase()));
    
    if (isSpecialPackage && (command === "uninstall" || command === "install" || command === "upgrade")) {
      console.log(`Using direct approach for ${command} ${args.join(' ')}`);
      
      // For Parallels specifically, use a more direct approach
      if (args[0].toLowerCase().includes('parallels')) {
        // First, try the zap option which is more forceful
        const zapArgs = [...args, '--zap'];
        const proc = Bun.spawn(['brew', command, ...zapArgs], {
          stdout: 'pipe',
          stderr: 'pipe',
          env: { ...process.env, SUDO_ASKPASS: process.env.SUDO_ASKPASS }
        });
        
        // Set a timeout of 60 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Operation timed out after 60 seconds'));
          }, 60000);
        });
        
        try {
          // Race between the process completion and timeout
          const exitCode = await Promise.race([
            proc.exited,
            timeoutPromise
          ]);
          
          const stdout = await new Response(proc.stdout).text();
          const stderr = await new Response(proc.stderr).text();
          
          return {
            stdout,
            stderr,
            success: exitCode === 0
          };
        } catch (err) {
          console.error('Error or timeout occurred:', err.message);
          // Kill the process if it's a timeout
          try {
            process.kill(-proc.pid, 'SIGKILL');
          } catch (killErr) {
            console.error('Error killing process:', killErr);
          }
          
          return {
            stdout: '',
            stderr: 'Operation timed out or was interrupted: ' + err.message,
            success: false
          };
        }
      }
      
      // For other special packages
      const proc = Bun.spawn(['brew', command, ...args], {
        stdout: 'pipe',
        stderr: 'pipe',
        env: { ...process.env, SUDO_ASKPASS: process.env.SUDO_ASKPASS }
      });
      
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;
      
      return {
        stdout,
        stderr,
        success: exitCode === 0
      };
    }
    
    // Regular execution without sudo
    const proc = Bun.spawn(['brew', command, ...args], {
      stdout: 'pipe',
      stderr: 'pipe',
    });
    
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;
    
    return {
      stdout,
      stderr,
      success: exitCode === 0
    };
  } catch (error) {
    console.error(`Error executing brew ${command}:`, error);
    return {
      stdout: '',
      stderr: error.message || 'Unknown error occurred',
      success: false
    };
  }
}

/**
 * Search for packages in Homebrew
 * 
 * @param {string} query - The search query
 * @returns {Promise<Array<{name: string, description: string}>>}
 */
async function searchPackages(query) {
  if (!query || query.trim() === "") {
    return [];
  }

  const { stdout, success } = await executeBrewCommand("search", [query]);
  
  if (!success || !stdout) {
    return [];
  }
  
  // First, try to get more detailed info using --json format
  try {
    const { stdout: jsonOutput, success: jsonSuccess } = await executeBrewCommand("info", ["--json=v2", query]);
    
    if (jsonSuccess && jsonOutput) {
      try {
        const info = JSON.parse(jsonOutput);
        if (info.formulae && info.formulae.length > 0) {
          return info.formulae.map(formula => ({
            name: formula.name,
            description: formula.desc || ""
          }));
        }
      } catch (error) {
        console.error("Error parsing JSON output:", error);
        // Fall back to regular parsing
      }
    }
  } catch (error) {
    // Silently fall back to regular parsing
  }

  // Fall back to parsing the search results directly
  // Format can vary, but typically: package_name: description
  const packages = [];
  const lines = stdout.split("\n").filter(line => line.trim() !== "");
  
  for (const line of lines) {
    // Try different regex patterns to match package and description
    const colonMatch = line.match(/^([\w-]+)(?::\s*(.+))?$/);
    const equalsMatch = line.match(/^([\w-]+)(?:\s*=\s*(.+))?$/);
    
    if (colonMatch) {
      packages.push({
        name: colonMatch[1],
        description: colonMatch[2] || ""
      });
    } else if (equalsMatch) {
      packages.push({
        name: equalsMatch[1],
        description: equalsMatch[2] || ""
      });
    } else {
      // If no description could be parsed, just use the name
      const nameOnly = line.trim().split(/\s+/)[0];
      if (nameOnly) {
        packages.push({
          name: nameOnly,
          description: ""
        });
      }
    }
  }
  
  // For packages without descriptions, fetch them individually
  for (const pkg of packages) {
    if (!pkg.description) {
      try {
        const packageInfo = await getPackageInfo(pkg.name);
        if (packageInfo && packageInfo.desc) {
          pkg.description = packageInfo.desc;
        }
      } catch (error) {
        // Ignore errors when fetching individual package info
      }
    }
  }

  return packages;
}

/**
 * Get a list of all installed packages
 * 
 * @returns {Promise<Array<{name: string, version: string, outdated: boolean, newVersion: string}>>}
 */
async function getInstalledPackages() {
  // Get list of installed packages
  const { stdout: installedOutput, success: installedSuccess } = 
    await executeBrewCommand("list", ["--versions"]);
  
  if (!installedSuccess || !installedOutput) {
    return [];
  }

  // Get list of outdated packages
  const { stdout: outdatedOutput, success: outdatedSuccess } = 
    await executeBrewCommand("outdated", ["--verbose"]);
  
  // Create a map of outdated packages for quicker lookup
  const outdatedMap = new Map();
  
  if (outdatedSuccess && outdatedOutput) {
    outdatedOutput
      .split("\n")
      .filter(line => line.trim() !== "")
      .forEach(line => {
        // Format is typically: package_name (current_version) < new_version
        const match = line.match(/^([\w-]+)\s+\((.+?)\)\s+<\s+(.+)/);
        if (match) {
          outdatedMap.set(match[1], {
            currentVersion: match[2],
            newVersion: match[3].trim()
          });
        }
      });
  }

  // Parse installed packages
  const packages = installedOutput
    .split("\n")
    .filter(line => line.trim() !== "")
    .map(line => {
      // Format is typically: package_name version1 version2 ...
      const parts = line.trim().split(/\s+/);
      const name = parts[0];
      const version = parts[1]; // Use the most recent version if multiple are installed
      
      const outdatedInfo = outdatedMap.get(name);
      const outdated = !!outdatedInfo;
      const newVersion = outdated ? outdatedInfo.newVersion : version;

      return {
        name,
        version,
        outdated,
        newVersion
      };
    });

  return packages;
}

/**
 * Install a package
 * 
 * @param {string} packageName - The name of the package to install
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function installPackage(packageName) {
  if (!packageName || packageName.trim() === "") {
    return {
      success: false,
      message: "Package name is required"
    };
  }

  const { stdout, stderr, success } = await executeBrewCommand("install", [packageName]);
  
  return {
    success,
    message: success 
      ? `Successfully installed ${packageName}`
      : `Failed to install ${packageName}: ${stderr}`
  };
}

/**
 * Uninstall a package
 * 
 * @param {string} packageName - The name of the package to uninstall
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function uninstallPackage(packageName) {
  if (!packageName || packageName.trim() === "") {
    return {
      success: false,
      message: "Package name is required"
    };
  }

  // Special handling for Parallels
  if (packageName.toLowerCase().includes('parallels')) {
    const { stdout, stderr, success } = await executeBrewCommand("uninstall", [packageName, "--force"]);
    
    return {
      success,
      message: success 
        ? `Successfully uninstalled ${packageName}`
        : `Failed to uninstall ${packageName}: ${stderr}`
    };
  }

  // Regular uninstall for other packages
  const { stdout, stderr, success } = await executeBrewCommand("uninstall", [packageName]);
  
  return {
    success,
    message: success 
      ? `Successfully uninstalled ${packageName}`
      : `Failed to uninstall ${packageName}: ${stderr}`
  };
}

/**
 * Update a specific package
 * 
 * @param {string} packageName - The name of the package to update
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function updatePackage(packageName) {
  if (!packageName || packageName.trim() === "") {
    return {
      success: false,
      message: "Package name is required"
    };
  }

  const { stdout, stderr, success } = await executeBrewCommand("upgrade", [packageName]);
  
  return {
    success,
    message: success 
      ? `Successfully updated ${packageName}`
      : `Failed to update ${packageName}: ${stderr}`
  };
}

/**
 * Update all packages
 * 
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function updateAllPackages() {
  const { stdout, stderr, success } = await executeBrewCommand("upgrade");
  
  return {
    success,
    message: success 
      ? "Successfully updated all packages"
      : `Failed to update packages: ${stderr}`
  };
}

/**
 * Update Homebrew itself and its package database
 * 
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function updateHomebrew() {
  const { stdout, stderr, success } = await executeBrewCommand("update");
  
  return {
    success,
    message: success 
      ? "Successfully updated Homebrew"
      : `Failed to update Homebrew: ${stderr}`
  };
}

/**
 * Get detailed information about a package
 * 
 * @param {string} packageName - The name of the package
 * @returns {Promise<Object>} - Package information
 */
async function getPackageInfo(packageName) {
  if (!packageName || packageName.trim() === "") {
    return null;
  }

  const { stdout, success } = await executeBrewCommand("info", [packageName, "--json=v2"]);
  
  if (!success || !stdout) {
    return null;
  }

  try {
    // Parse the JSON output
    const info = JSON.parse(stdout);
    return info.formulae?.[0] || null;
  } catch (error) {
    console.error("Error parsing package info:", error);
    return null;
  }
}

export {
  executeBrewCommand,
  getInstalledPackages,
  getPackageInfo,
  installPackage,
  searchPackages,
  uninstallPackage,
  updateAllPackages,
  updateHomebrew,
  updatePackage
};
