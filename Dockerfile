# Use the official Node.js image as the base image
FROM node:25-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .
COPY ./.env .env

# Build the NestJS application
RUN npm run build

# Expose the application port
EXPOSE 3228

# Command to run the application
# CMD ["node", "dist/main"]
CMD ["npm", "run", "start"]
