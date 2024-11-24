# VSCode Searchable Extension

A VSCode extension that adds a custom GitHub Copilot Chat participant for searching GitHub code repositories. This extension enhances your coding experience by allowing you to search GitHub code using regex patterns directly from within VSCode's Copilot Chat.

## Features

- Integrates with GitHub Copilot Chat as a custom participant
- Search GitHub code repositories using regex patterns
- View code snippets and repository links directly in the chat
- Secure GitHub token management

## Prerequisites

- Visual Studio Code 1.93.0 or higher
- GitHub Copilot Chat extension installed
- GitHub Personal Access Token with appropriate permissions

## Installation

1. Download the latest `.vsix` file from the releases page
2. Open VSCode
3. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
4. Type "Install from VSIX" and select the command
5. Choose the downloaded `.vsix` file

Alternatively, you can install from the command line:
```bash
code --install-extension vscode-searchable-1.0.0.vsix
```

## Setup

1. On first use, the extension will prompt you for a GitHub Personal Access Token
2. Create a token at https://github.com/settings/tokens with the following scopes:
   - `repo`
   - `read:user`
3. Enter the token when prompted

To reset your GitHub token:
1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run the command "Searchable: Reset GitHub Token"

## Usage

1. Open GitHub Copilot Chat in VSCode
2. Select the "searchable" participant
3. Enter your search query
4. The extension will search GitHub repositories and display results with:
   - Repository names
   - Direct links to code
   - Code snippets with matching content

Example queries:
```
Search for React hooks: "useEffect.*="
Find TypeScript interfaces: "interface.*{}"
Look for specific function calls: "fetchData\("
```

## Development

To build the extension from source:

1. Clone the repository
```bash
git clone https://github.com/HikaruEgashira/github-resercher
cd github-resercher
```

2. Install dependencies
```bash
bun install
```

3. Build the extension
```bash
bun compile
```

4. Package the extension
```bash
bunx vsce package
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
