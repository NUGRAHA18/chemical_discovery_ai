FROM node:18-alpine
WORKDIR /app

# Install dependencies (production only)
COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY src ./src

# Volume mount point untuk profile/structure images
RUN mkdir -p public/images/profiles public/images/structures

EXPOSE 3010
CMD ["node", "src/server.js"]
