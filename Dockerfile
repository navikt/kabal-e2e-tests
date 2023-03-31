FROM mcr.microsoft.com/playwright:v1.32.1-focal

ENV NODE_ENV test
ENV FORCE_COLOR 0

ARG CI
ENV CI ${CI}

WORKDIR /usr/src/app

COPY . .

CMD ["npm", "test"]
