# company-finder

## Description
Company Finder is a tool designed to help users find detailed information about companies. 

The project scrapes contact data such as:
- Phone number
- Address
- Facebook information

The data is scraped from a list of domains and merged with additional company information. Finally, the details are stored and ready to be interrogated.

## Services

### Contact Scraper
The Contact Scraper service is built using Scrapy, a Python framework for web scraping. It scrapes company data from a list of domains read from a CSV file, which is specified by the environment variable `CSV_DOMAIN_FILENAME`. The CSV file must have at least one column named "domain".

The scraper searches for address, phone number, and Facebook links on the first page. If the details are not obtained, it will continue to search on the "Contact" and "About us" pages.

At the end, a message will be pushed to Kafka with the following format: 
- domain
- url
- website
- phone_number
- address
- facebook_url
- timestamp

### Kafka Consumers

This service consumes from a Kafka topic the messages produced by the Contact Scraper Service. 
It then merges the contact details of a company with additional information about the company names, which are loaded from a CSV file. The CSV file must have the following columns:
- `domain`
- `company_commercial_name`
- `company_legal_name`
- `company_all_available_names`

The name of the CSV file is read from an environment variable `CSV_COMPANY_FILENAME`.

Finally, all the information will be stored in an Elasticsearch index, allowing users to search for it.

### Company API

The Company API service provides an interface to access the company data stored in Elasticsearch. It’s built with Node.js using the Fastify framework.

#### Query Parameters
The API accepts the following query parameters to filter the company data:

- `name` (string): The name of the company. It will be used to search through all the "name" fields of a company.
- `phoneNumber` (string): The phone number of the company. 
- `facebook` (string): The Facebook page of the company.

At least one query parameter is required.

#### Response
The API returns a JSON object with the following fields:
- `commercialName` (string): The commercial name of the company.
- `legalName` (string): The legal name of the company.
- `availableNames` (array of strings): A list of alternative names for the company.
- `website` (string): The website URL of the company.
- `address` (string): The physical address of the company.
- `facebook` (string): The Facebook page URL of the company.
- `phoneNumber` (array of strings): A list of telephone numbers of the company.

#### Example

**Request:**
```
GET /api/company?name=ExampleCompany
```

**Response:**
```json
{
    "commercialName": "Example Company",
    "legalName": "Example Company LLC",
    "availableNames": ["Example Co", "Example"],
    "website": "https://www.example.com",
    "address": "123 Example Street, Example City, EX 12345",
    "facebook": "https://www.facebook.com/examplecompany",
    "phoneNumber": ["+1234567890", "+0987654321"]
}
```

## Setup and Configuration

### Prerequisites
Ensure you have the following installed:
- Docker
- Docker Compose

### Installation
To install the project, follow these steps:

Clone the repository:

```bash
git clone https://github.com/AndreeaCapatina/company-finder.git
cd company-finder
```

### Environment Variables
Some environment variables need to be set up before running the services. These include configurations for Kafka, Elasticsearch, and file paths for scraping data. They should be defined in a .env file inside the /docker directory.

```bash
cd docker
touch .env
```

Here’s an example .env file:

```env
# Company API port
COMPANY_API_PORT=3001

# Kafka settings
KAFKA_BROKER=kafka:9092
KAFKA_TOPIC=company-data
KAFKA_GROUP_ID=company-es-ingest
KAFKA_CLIENT_ID=contact-scraper-producer

# Elasticsearch settings
ES_HOST=http://elasticsearch:9200
ES_COMPANY_INDEX=company

# CSV files for domains and company names
CSV_DIR_PATH=/usr/src/app/data
CSV_DOMAIN_FILENAME=domains.csv
CSV_COMPANY_FILENAME=websites-company-names.csv
```

### Running the Services

1. Build all the services defined in docker/docker-compose.yml:
```bash
docker-compose build
```

2. Run the setup script to start services in the correct order:
```bash
sh setup_environment.sh
```

This script will:
✅ Start core services (Elasticsearch, Kibana, Kafka, and Zookeeper).
✅ Wait for Elasticsearch to be ready.
✅ Run the scripts/setup_elasticsearch.sh script to configure indices.
✅ Start the remaining services (contact-scraper, kafka-consumer, company-api).

3. The Company API will be available at:
**Request:**
```
GET <yourIP>:<company_api_port>/api/company?name=ExampleCompany
```

## License
This project is licensed under the MIT License.