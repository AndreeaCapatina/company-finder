#!/bin/bash

# Stop all running containers
echo "Stopping all running containers..."
docker stop $(docker ps -aq)

# Remove all containers
echo "Removing all containers..."
docker rm $(docker ps -aq)

# Remove all images
echo "Removing all images..."
docker rmi $(docker images -q)

# Optionally, remove all volumes
echo "Removing all volumes..."
docker volume rm $(docker volume ls -q)

# Rebuild and start the containers using docker-compose
echo "Rebuilding and starting containers..."
docker-compose up --build -d

echo "Process completed successfully."
