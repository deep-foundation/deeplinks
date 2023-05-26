FROM node:16.20.0 AS node
FROM docker:20.10.8-dind-alpine3.13 

COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/share /usr/local/share
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin

COPY package.json .
COPY index.js .
COPY index.js.map .
COPY index.ts .
COPY node_modules ./node_modules
COPY imports ./imports
COPY snapshots ./snapshots
COPY backup ./backup

ENV PORT 3006
ENV DOCKER 1
ENV DEBUG_COLORS true
ENV DEBUG deeplinks:*

RUN apk add docker-compose=1.27.4-r0
RUN apk add --no-cache libgcc libstdc++ libc6-compat openssl

EXPOSE 3006
ENTRYPOINT ["node", "index.js"]
