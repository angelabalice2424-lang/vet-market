FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data \
    TZ=America/Argentina/Buenos_Aires

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY . .

VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "src/server.js"]
