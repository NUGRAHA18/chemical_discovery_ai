# Stage 1: Build React app
FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Inject build args so docker-compose prod values override the .env file
ARG REACT_APP_API_URL=http://localhost:3010/api
ARG REACT_APP_BACKEND_URL=http://localhost:3010
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf