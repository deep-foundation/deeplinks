FROM node:12.16-stretch

COPY ./package.json .
COPY ./package-lock.json .
COPY ./index.ts .
COPY build ./build
COPY node_modules ./node_modules

ENV PORT 3006

EXPOSE 3006
ENTRYPOINT ["npm", "start"]
