#!/bin/bash

# Script to configure macOS Firewall for Asset Management App
# This script will allow Node.js to accept incoming connections

echo "================================================"
echo "  Asset Management App - Firewall Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}This script needs sudo privileges.${NC}"
    echo "Please enter your password when prompted."
    echo ""
fi

# Find Node.js path
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo -e "${RED}✗ Node.js not found!${NC}"
    echo "Please install Node.js first."
    exit 1
fi

echo -e "${GREEN}✓ Found Node.js at: $NODE_PATH${NC}"
echo ""

# Check firewall status
echo "Checking firewall status..."
FIREWALL_STATUS=$(sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate)
echo "$FIREWALL_STATUS"
echo ""

# Add Node.js to firewall exceptions
echo "Adding Node.js to firewall exceptions..."
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add "$NODE_PATH" 2>/dev/null

# Unblock Node.js
echo "Allowing incoming connections for Node.js..."
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp "$NODE_PATH"

# Check if successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Node.js has been allowed through the firewall!${NC}"
else
    echo -e "${RED}✗ Failed to configure firewall${NC}"
    echo "You may need to configure it manually via System Settings."
fi

echo ""
echo "================================================"
echo "  Configuration Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Restart your backend server (Ctrl+C then npm run dev)"
echo "2. Make sure your Mac and phone are on the same WiFi"
echo "3. Access from phone: http://192.168.18.32:5174"
echo ""
echo "Test backend API from phone browser:"
echo "http://192.168.18.32:5001/api/auth/login"
echo ""
echo "If still not working, try:"
echo "- System Settings → Network → Firewall → Options"
echo "- Add Node.js manually and set to 'Allow incoming connections'"
echo ""
