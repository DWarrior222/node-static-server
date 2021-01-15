FROM node:12.20-alpine3.10
COPY . /app
WORKDIR /app
RUN rm -rf node_modules
RUN yarn --registry=https://registry.npm.taobao.org
EXPOSE 3000
CMD node ./app.js