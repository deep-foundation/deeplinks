FROM node:15.10-alpine
COPY .env .
COPY . .
COPY package.json .
COPY tsconfig.json .
EXPOSE 3007
ENV PORT 3007
CMD [ "npm", "start" ]