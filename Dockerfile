FROM node:12.16-stretch

COPY package.json .
COPY index.js .
COPY index.js.map .
COPY index.ts .
COPY node_modules ./node_modules
COPY imports ./imports

ENV PORT 3006
ENV DOCKER 1

EXPOSE 3006
ENTRYPOINT ["node", "index.js"]
