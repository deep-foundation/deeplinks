FROM node:12.16-stretch

RUN . npm ci
RUN . npm run build
COPY ./index.ts .
COPY build ./build
COPY node_modules ./node_modules
COPY ./package.json .

ENV PORT 3006

EXPOSE 3006
ENTRYPOINT ["npm", "start"]
