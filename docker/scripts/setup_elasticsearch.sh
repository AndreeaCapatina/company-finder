#!/bin/bash

cd "$(dirname "$0")"

# Default values for ES_HOST if environment variables are not set
ES_HOST="${ES_HOST:-http://localhost:9200}"

# Index and template names
INDEX_NAME="company"
TEMPLATE_NAME="company"
COMPONENT_TEMPLATE_NAME="common_settings"

SCRIPTS_DIR="$(pwd)"
# Path to the index template JSON file
TEMPLATE_FILE="${TEMPLATE_FILE:-${SCRIPTS_DIR}/index_template.json}"

# Path to the component template JSON file (settings)
COMPONENT_TEMPLATE_FILE="${COMPONENT_TEMPLATE_FILE:-${SCRIPTS_DIR}/settings_component_template.json}"

# Function to check if Elasticsearch is accessible
check_elasticsearch() {
    echo "Checking if Elasticsearch is accessible at $ES_HOST"
    if curl --silent --fail --show-error "$ES_HOST/_cluster/health" > /dev/null; then
        echo "✔ Elasticsearch is accessible at $ES_HOST"
    else
        echo "✘ Elasticsearch is not accessible at $ES_HOST"
        exit 1
    fi
}

# Function to check if a file exists
check_file_exists() {
    local file=$1
    if [ ! -f "$file" ]; then
        echo "✘ Error: File $file does not exist."
        exit 1
    fi
}

# Function to create a template
create_template() {
    local url=$1
    local file=$2
    local name=$3
    response=$(curl -s -w "%{http_code}" -X PUT "$url" -H 'Content-Type: application/json' -d@"$file")
    http_status="${response: -3}"
    response_body="${response:0:${#response}-3}"

    if [ "$http_status" -eq 200 ]; then
        echo "✔ $name created successfully."
    else
        echo "✘ Failed to create $name. HTTP status code: $http_status"
        echo "Response body: $response_body"
        exit 1
    fi
}

# Function to create an index
create_index() {
    local index_name=$1
    response=$(curl -s -w "%{http_code}" -X PUT "$ES_HOST/$index_name" -H 'Content-Type: application/json' -d'{}')
    http_status="${response: -3}"
    response_body="${response:0:${#response}-3}"

    if [ "$http_status" -eq 200 ]; then
        echo "✔ Index created: $index_name"
    else
        echo "✘ Failed to create index: $index_name. HTTP status code: $http_status"
        echo "Response body: $response_body"
        exit 1
    fi
}

# Check if Elasticsearch is accessible
check_elasticsearch

# Check if the template files exist
check_file_exists "$TEMPLATE_FILE"
check_file_exists "$COMPONENT_TEMPLATE_FILE"

# Create the component template (settings)
create_template "$ES_HOST/_component_template/$COMPONENT_TEMPLATE_NAME" "$COMPONENT_TEMPLATE_FILE" "Component template"

# Create the index template that references the component template
create_template "$ES_HOST/_index_template/$TEMPLATE_NAME" "$TEMPLATE_FILE" "Index template"

# Check if the index already exists
echo "Checking if index '$INDEX_NAME' exists..."
if curl --head --fail "$ES_HOST/$INDEX_NAME" > /dev/null 2>&1; then
    echo "✔ Index $INDEX_NAME already exists."
    read -p "Do you want to delete the existing index and recreate it? (y/n): " choice
    if [ "$choice" == "y" ]; then
        # Delete the existing index
        response=$(curl -s -w "%{http_code}" -X DELETE "$ES_HOST/$INDEX_NAME")
        http_status="${response: -3}"
        response_body="${response:0:${#response}-3}"

        if [ "$http_status" -eq 200 ]; then
            echo "✔ Index deleted: $INDEX_NAME"
        else
            echo "✘ Failed to delete index: $INDEX_NAME. HTTP status code: $http_status"
            exit 1
        fi

        # Create the index
        create_index "$INDEX_NAME"
    else
        echo "Skipping index creation."
    fi
else
    # Create the index
    create_index "$INDEX_NAME"
fi

echo "✔ Setup completed successfully."
