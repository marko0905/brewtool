# BrewTool

A terminal user interface (TUI) for Homebrew package management, built with JavaScript, BUN and Ink.

## Description

BrewTool provides an intuitive terminal-based interface for managing your Homebrew packages. Inspired by tools like lazygit, it brings a modern, keyboard-driven interface to Homebrew operations.

## Features

- **Three-panel interface** for easy navigation:
  - Search Panel: Find and install new packages
  - Main Panel: Manage installed packages
  - Brewfile Panel: Create and manage Brewfiles

- **Search capabilities**:
  - Search for available packages in Homebrew
  - View package descriptions
  - Select and install multiple packages

- **Package management**:
  - View all installed packages
  - Update outdated packages
  - Easily uninstall packages
  - Select multiple packages for bulk operations
  - Filter installed packages with search function

- **Brewfile integration**:
  - Generate Brewfile from installed packages
  - Update Brewfile when packages change
  - Install packages from existing Brewfile
  - Support for symlinked Brewfiles

- **User-friendly interface**:
  - Contextual command bar
  - Visual indicators for selection and focus
  - Scrollbars for navigating large lists
  - Color-coded statuses for packages
  - Adaptive layout based on terminal size

## Installation

### Via Homebrew (Recommended)

```bash
# Add the tap
brew tap marko0905/tap

# Install BrewTool
brew install brewtool
```

### Install from source

#### Prerequisites

- [Node.js](https://nodejs.org) (v16+)
- [Bun](https://bun.sh) (v1.2+)
- [Homebrew](https://brew.sh)

```bash
# Clone the repository
git clone https://github.com/marko0905/brewtool.git
cd brewtool

# Install dependencies
bun install

# Run the application
bun run start
```

## Usage

After launching BrewTool, you can navigate between panels using the number keys:

- `1` - Switch to Search panel
- `2` - Switch to Main panel
- `3` - Switch to Brewfile panel
- `q` - Quit the application

### Search Panel Commands

- `/` - Start search
- `Enter` - Execute search
- `↑`/`↓` - Navigate through search results
- `Space` - Select/deselect package
- `i` - Install selected packages
- `Esc` - Cancel search/clear results

### Main Panel Commands

- `↑`/`↓` - Navigate through packages
- `Space` - Select/deselect package
- `u` - Update selected packages
- `d` - Delete selected packages
- `/` - Filter packages
- `Esc` - Exit search/filtering

### Brewfile Panel Commands

- `c` - Create Brewfile from installed packages
- `u` - Update Brewfile
- `i` - Install packages from Brewfile
- `r` - Refresh Brewfile status

## Project Structure

```
brewtool/
├── components/         # UI components
│   ├── App.jsx         # Main application component
│   ├── SearchPanel.jsx # Package search interface
│   ├── MainPanel.jsx   # Installed packages interface
│   ├── BrewfilePanel.jsx # Brewfile management
│   ├── CommandBar.jsx  # Context-sensitive command display
│   └── common/         # Shared UI components
├── services/           # Business logic
│   ├── brewServices.js # Homebrew operations
│   └── fileService.js  # File operations for Brewfile
├── utils/              # Utility functions
│   └── hooks.js        # Custom React hooks
├── index.js            # Application entry point
└── package.json        # Project dependencies
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [lazygit](https://github.com/jesseduffield/lazygit)
- Built with [Ink](https://github.com/vadimdemedes/ink)
- Made possible by [Homebrew](https://brew.sh)