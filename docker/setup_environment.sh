#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Use ES_HOST from environment or default to localhost
ES_HOST="http://localhost:9200"
MAX_RETRIES=30
RETRY_INTERVAL=5

# Start only the necessary services first
echo "🚀 Starting essential services (Elasticsearch, Kibana, Zookeeper, Kafka)..."
docker-compose up -d elasticsearch kibana zookeeper kafka

# Wait for Elasticsearch to be ready
echo "⏳ Waiting for Elasticsearch to be available at $ES_HOST..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl --silent --fail --head "$ES_HOST" > /dev/null; then
        echo "✔ Elasticsearch is up!"
        break
    fi
    echo "Retry $i/$MAX_RETRIES: Elasticsearch not ready yet. Retrying in $RETRY_INTERVAL seconds..."
    sleep $RETRY_INTERVAL
done

# Run Elasticsearch setup script
echo "⚙️ Running Elasticsearch setup..."
echo "y" | bash scripts/setup_elasticsearch.sh
if [ $? -ne 0 ]; then
    echo "❌ Elasticsearch setup failed. Stopping setup."
    exit 1
fi

# Start remaining services after successful Elasticsearch setup
echo "🚀 Starting remaining services (contact_scraper, kafka-consumer, company-api)..."
docker-compose up -d contact_scraper kafka-consumer company-api

echo "✅ Setup completed!"
