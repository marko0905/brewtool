# Changelog

## 0.2.1 (2025-05-14)

### Fixed
- Improved detection of outdated packages from taps
- Fixed issue where BrewTool couldn't detect updates to itself

## 0.2.0 (2025-05-13)

### Added
- Sudo handling for privileged operations
- One-time password prompt at startup
- Special handling for packages requiring elevated privileges

### Fixed
- Prevented password prompts from appearing in the terminal UI
- Added timeout protection for long-running operations