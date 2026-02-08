# Claude Settings Manager

A visual editor for Claude Code settings. Manage permissions, sandbox rules, model preferences, and hooks across global and project scopes.

## Quick Install (macOS Apple Silicon)

```bash
curl -fsSL https://raw.githubusercontent.com/cameronfleet-paxos/claude-settings-manager/main/install.sh | bash
```

Then open **Claude Settings** from `~/Applications`.

## Features

- **Permissions**: Manage allowed Bash commands and MCP tool permissions
- **Sandbox**: Configure filesystem and network access rules
- **Model**: Set preferred Claude model and custom instructions
- **Hooks**: Configure pre/post command hooks
- **Commands**: View and manage slash commands

## Development

```bash
pnpm install
pnpm dev              # Next.js dev server at http://localhost:3000
pnpm electron:dev     # Run in Electron with hot reload
```

## Building

```bash
./scripts/deploy-local.sh    # Build and install to ~/Applications
pnpm electron:build          # Build production DMG (dist/Claude-Settings-*.dmg)
```
