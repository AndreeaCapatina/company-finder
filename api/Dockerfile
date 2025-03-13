# Use the official Node.js v18 LTS image as the base
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set the default port from environment variable or fallback to 3000 if not set
ENV COMPANY_API_PORT=${COMPANY_API_PORT:-3000}

# Expose the COMPANY_API_PORT to the outside
EXPOSE ${COMPANY_API_PORT}

# Run the application when the container starts
CMD ["npm", "start"]
