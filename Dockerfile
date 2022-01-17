FROM mcr.microsoft.com/playwright:v1.17.2-focal

ENV NODE_ENV test

WORKDIR /usr/src/app
COPY . .

CMD ["npm", "test"]
