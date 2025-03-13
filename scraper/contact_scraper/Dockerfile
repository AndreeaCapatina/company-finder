# Use a Python base image with a suitable version (e.g., Python 3.9)
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies listed in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project into the container
COPY . .

# Set environment variables that are needed for Kafka and the CSV files
ENV KAFKA_BROKER=${KAFKA_BROKER}
ENV KAFKA_TOPIC=${KAFKA_TOPIC}
ENV KAFKA_CLIENT_ID=${KAFKA_CLIENT_ID}
ENV CSV_DIR_PATH=${CSV_DIR_PATH}
ENV CSV_DOMAIN_FILENAME=${CSV_DOMAIN_FILENAME}

# Run the Scrapy spider when the container starts
CMD ["scrapy", "crawl", "contacts"]
