FROM mcr.microsoft.com/playwright:v1.32.0-focal

ARG CI
ENV CI ${CI}
ENV NODE_ENV test
ENV FORCE_COLOR 0

WORKDIR /usr/src/app
COPY . .

CMD ["npm", "test"]
