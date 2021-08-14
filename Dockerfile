FROM node:15.10-alpine
RUN /bin/sh -c 'ls'
COPY .docker.env ./.env
COPY . .
EXPOSE 3007
ENV PORT 3007
CMD [ "npm", "start" ]