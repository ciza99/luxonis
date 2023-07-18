FROM node:latest as builder

WORKDIR /app

COPY ./package.json .
RUN npm i

COPY . .
RUN npm run build

# SERVE APP

FROM node:latest

WORKDIR /app

COPY --from=builder /app/dist ./dist

EXPOSE 8080

RUN npm i -g serve

CMD ["npx", "serve", "dist", "-p", "8080"]
