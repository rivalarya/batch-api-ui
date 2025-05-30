# Use Node.js as base image
FROM node:22-alpine

WORKDIR /app

# Copy only the built files
# Because i only using windows to build the project. and i get issue when building on linux
COPY dist/ ./dist/

# Install a simple HTTP server to serve static files
RUN npm install -g serve

# Expose port 8080
EXPOSE 8080

# Serve the built files
CMD ["serve", "-s", "dist", "-l", "8080"]