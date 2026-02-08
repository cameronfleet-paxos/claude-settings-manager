#!/bin/bash
#
# Claude Settings Installer
# One-line install: curl -fsSL https://raw.githubusercontent.com/cameronfleet-paxos/claude-settings-manager/main/install.sh | bash
#
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}Warning:${NC} $1"; }
error() { echo -e "${RED}Error:${NC} $1"; exit 1; }

# Check requirements
check_requirements() {
    # macOS only
    if [[ "$(uname)" != "Darwin" ]]; then
        error "Claude Settings only supports macOS"
    fi

    # arm64 only
    if [[ "$(uname -m)" != "arm64" ]]; then
        error "Claude Settings only supports Apple Silicon (arm64). Intel Macs are not supported."
    fi

    # curl required
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed"
    fi

    # hdiutil required (should always be present on macOS)
    if ! command -v hdiutil &> /dev/null; then
        error "hdiutil is required but not installed"
    fi
}

# Get latest release version from GitHub API
get_latest_version() {
    local latest
    latest=$(curl -fsSL "https://api.github.com/repos/cameronfleet-paxos/claude-settings-manager/releases/latest" 2>/dev/null | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
    if [[ -z "$latest" ]]; then
        error "Failed to fetch latest release version. Check your internet connection or try specifying a version with CLAUDE_SETTINGS_VERSION=v1.0.0"
    fi
    echo "$latest"
}

# Main installation
main() {
    info "Installing Claude Settings..."

    check_requirements

    # Determine version (use env var or fetch latest)
    local version="${CLAUDE_SETTINGS_VERSION:-}"
    if [[ -z "$version" ]]; then
        info "Fetching latest version..."
        version=$(get_latest_version)
    fi
    info "Version: $version"

    # Version without 'v' prefix for filename
    local version_number="${version#v}"

    # Download URL for DMG
    local download_url="https://github.com/cameronfleet-paxos/claude-settings-manager/releases/download/${version}/Claude-Settings-${version_number}-arm64.dmg"
    local tmp_dir=$(mktemp -d)
    local dmg_path="${tmp_dir}/ClaudeSettings.dmg"
    local mount_point="${tmp_dir}/claude_settings_mount"

    # Download
    info "Downloading Claude Settings..."
    if ! curl -fsSL "$download_url" -o "$dmg_path"; then
        rm -rf "$tmp_dir"
        error "Failed to download Claude Settings from $download_url"
    fi

    # Mount DMG
    info "Mounting disk image..."
    mkdir -p "$mount_point"
    if ! hdiutil attach "$dmg_path" -mountpoint "$mount_point" -nobrowse -quiet; then
        rm -rf "$tmp_dir"
        error "Failed to mount disk image"
    fi

    # Ensure ~/Applications exists
    mkdir -p ~/Applications

    # Remove existing installation
    if [[ -d "$HOME/Applications/Claude Settings.app" ]]; then
        info "Removing existing installation..."
        rm -rf "$HOME/Applications/Claude Settings.app"
    fi

    # Copy to ~/Applications
    info "Installing to ~/Applications..."
    cp -R "${mount_point}/Claude Settings.app" ~/Applications/

    # Unmount DMG
    info "Cleaning up..."
    hdiutil detach "$mount_point" -quiet || true

    # Remove quarantine attribute (allows app to run without Gatekeeper warning)
    info "Removing quarantine attribute..."
    xattr -rd com.apple.quarantine "$HOME/Applications/Claude Settings.app" 2>/dev/null || true

    # Cleanup
    rm -rf "$tmp_dir"

    echo ""
    info "Claude Settings installed successfully!"
    echo ""
    echo "To launch:"
    echo "  open ~/Applications/Claude\ Settings.app"
    echo ""
    echo "Or find it in Finder: ~/Applications/Claude Settings.app"
    echo ""
}

main "$@"
