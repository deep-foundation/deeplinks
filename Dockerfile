FROM hasura/graphql-engine:v1.3.2 as base
FROM debian:buster
WORKDIR /app
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt update 
RUN apt install -y libpq5 libpq-dev screen curl git build-essential libssl-dev

ENV NODE_VERSION=15.11.0
RUN mkdir /var/local/.nvm
ENV NVM_DIR=/var/local/.nvm
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION} && nvm use v${NODE_VERSION} && nvm alias default v${NODE_VERSION}
ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

COPY ./package.json .
COPY ./package-lock.json .
COPY ./pages ./pages
COPY ./imports ./imports
COPY ./tsconfig.json .
COPY ./.docker.env ./.env
COPY ./next* ./

COPY ./start.js ./start.js
COPY --from=base /bin/graphql-engine ./graphql-engine

EXPOSE 8080
ENTRYPOINT ["node", "start.js"]