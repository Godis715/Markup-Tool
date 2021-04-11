FROM node:12

WORKDIR /usr/app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install && mkdir frontend && mv ./package.json ./package-lock.json ./node_modules ./frontend

COPY markup-service/package.json markup-service/package-lock.json ./
RUN npm install && mkdir markup-service && mv ./package.json ./package-lock.json ./node_modules ./markup-service

WORKDIR /usr/app/frontend
COPY ./frontend .
ENV REACT_APP_BASE_URL=http://localhost:8000
RUN npm run build

WORKDIR /usr/app/markup-service
COPY ./markup-service .

EXPOSE 8000

CMD ["npm", "start"]
