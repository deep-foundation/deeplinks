FROM node:15.10.0-alpine
COPY . .
CMD [ "npm", "run", "pwd-start" ]