FROM node

RUN npm i -g yarn

WORKDIR /bot

COPY package.json yarn.lock ./

RUN yarn install --production

COPY .env .

COPY ./build ./build

ENV NODE_ENV production

CMD ["node", "./build/index.js"]
