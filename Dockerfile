# Production image — avoids Nixpacks/Nix (GitHub nixpkgs fetch failures on Railway)
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY --from=build /app/dist/omra-front/browser ./dist/omra-front/browser
EXPOSE 8080
CMD ["node", "server.js"]
