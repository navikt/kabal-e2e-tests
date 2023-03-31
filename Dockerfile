FROM mcr.microsoft.com/playwright:v1.32.1-focal

ENV NODE_ENV test
ENV FORCE_COLOR 0

WORKDIR /usr/src/app

COPY . .

ARG CI
ENV CI ${CI}

CMD ["npm", "test"]
