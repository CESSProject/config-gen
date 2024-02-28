FROM node:16-alpine as builder

WORKDIR /opt/app
COPY package.json .
RUN npm install && npm prune --omit=dev

COPY schema schema
COPY config-gen config-gen
COPY index.js logger.js utils.js ./

ENTRYPOINT [ "node", "index.js" ]