# reference: https://jonathas.com/scheduling-tasks-with-cron-on-docker/

FROM node:12.16-alpine

COPY . /app
WORKDIR /app

RUN apk update && apk add tzdata &&\
    cp /usr/share/zoneinfo/Europe/Paris /etc/localtime &&\
    echo "Europe/Paris" > /etc/timezone &&\
    apk del tzdata && rm -rf /var/cache/apk/*

#ENV NODE_ENV production
#RUN npm install --production --quiet

RUN npm install typescript -g
RUN npm install
RUN tsc

CMD ["node", "build/webserver.js"]
