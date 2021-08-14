FROM node:14
RUN /bin/bash -c 'ls'
COPY .docker.env ./.env
COPY . .
EXPOSE 3007
ENV PORT 3007
CMD [ "npm", "start" ]