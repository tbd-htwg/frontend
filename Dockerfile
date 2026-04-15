FROM node:22-alpine AS build
WORKDIR /app

# Empty = same-origin `/api/v2` (Caddy in infrastructure routes /api/v2 to the backend container).
# Override at build time if the SPA is served from a different host than the API.
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
