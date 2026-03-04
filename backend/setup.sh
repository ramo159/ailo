#!/bin/bash
# Simple setup script for Ailo backend

echo "Setting up Ailo Backend..."

# Check if python3-venv is installed
echo "1. Checking python3-venv..."
if ! python3 -m venv --help &> /dev/null; then
    echo "python3-venv not installed!"
    echo ""
    echo "Please run:"
    echo "  sudo apt install python3-venv"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Create virtual environment
echo "2. Creating virtual environment..."
python3 -m venv venv

# Activate venv
echo "3. Activating venv..."
source venv/bin/activate

# Install dependencies
echo "4. Installing dependencies..."
pip install -r requirements.txt

# Create .env if doesn't exist
if [ ! -f .env ]; then
    echo "5. Creating .env file..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Edit .env file with your settings!"
    else
        echo ".env.example not found, skipping..."
    fi
else
    echo "5. .env file already exists, skipping..."
fi

echo ""
echo "Yay setup complete!"
echo ""
echo "To run the server:"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""
echo "To deactivate venv:"
echo "  deactivate"