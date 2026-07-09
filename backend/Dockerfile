FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Expose port
EXPOSE 4000

# Start server
CMD ["npm", "start"]
