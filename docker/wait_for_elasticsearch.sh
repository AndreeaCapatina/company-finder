#!/bin/bash

# Wait for Elasticsearch to be ready
echo "Waiting for Elasticsearch to be ready..."
until curl -s http://elasticsearch:9200/_cluster/health | grep -q '"status":"green"'; do
  echo "Elasticsearch not ready yet, waiting..."
  sleep 5
done
echo "Elasticsearch is ready!"

# Run your Elasticsearch setup script
echo "Running Elasticsearch setup..."
echo "n" | ./scripts/setup_elasticsearch.sh