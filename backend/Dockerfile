FROM node:18-slim

# Install Lua
RUN apt-get update && \
    apt-get install -y lua5.3 git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Clone Prometheus
RUN git clone https://github.com/levno-710/Prometheus.git prometheus

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
