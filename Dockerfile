FROM mcr.microsoft.com/playwright:v1.19.1-focal

ENV NODE_ENV test

WORKDIR /usr/src/app
COPY . .

CMD ["npm", "test"]
