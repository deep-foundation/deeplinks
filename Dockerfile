FROM node:15.10
RUN apt update
RUN apt install screen
FROM node:15.10-alpine
RUN /bin/sh -c 'ls'
COPY .docker.env ./.env
COPY . .
EXPOSE 3007
CMD [ "npm", "run", "pwd-start" ]