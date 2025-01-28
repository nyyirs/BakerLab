# Use Node.js v18 as the base image
FROM node:18-alpine

# Install necessary build tools and mysql-client
RUN apk add --no-cache libc6-compat netcat-openbsd mysql-client dos2unix

# Set working directory
WORKDIR /app

# Copy prisma directory first
COPY prisma ./prisma/

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --ignore-scripts

# Generate Prisma Client
RUN npx prisma generate

# Copy entrypoint script and set permissions
COPY entrypoint.sh ./entrypoint.sh
RUN dos2unix ./entrypoint.sh && \
    chmod +x ./entrypoint.sh

# Copy the rest of the application
COPY . .

# Build arguments for environment variables
ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Type check and build
RUN npm run lint || true
RUN OPENAI_API_KEY=$OPENAI_API_KEY npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set the entry point
ENTRYPOINT ["./entrypoint.sh"]
