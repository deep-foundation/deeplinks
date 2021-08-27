FROM node:15.10.0-alpine
COPY package.json .
COPY node_modules ./node_modules
COPY .env .
COPY tsconfig.json .
CMD [ "npm", "run", "pwd-start" ]