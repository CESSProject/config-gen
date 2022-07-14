FROM node:16-alpine as builder

WORKDIR /opt/app
COPY . .
RUN npm install && npm prune --omit=dev

ENTRYPOINT [ "node", "index.js" ]