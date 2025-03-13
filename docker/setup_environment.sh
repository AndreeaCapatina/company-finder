#!/bin/bash

# Print an error message and exit if a command fails
set -e

# Ensure that all services are built and started
echo "Building and starting services..."
docker-compose -f docker-compose.yml up -d --build

# Give some time for the services to initialize
echo "Waiting for services to initialize..."
sleep 30  # Adjust the time depending on your system

echo "Environment setup complete!"
