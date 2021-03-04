FROM node:12

WORKDIR /usr/app
COPY frontend/package.json frontend/package.json
COPY frontend/package-lock.json frontend/package-lock.json
COPY backend/package.json backend/package.json
COPY backend/package-lock.json backend/package-lock.json

WORKDIR /usr/app/frontend
RUN npm install

WORKDIR /usr/app/backend
RUN npm install

WORKDIR /usr/app
COPY . .

ENV REACT_APP_BASE_URL=http://localhost:8000
WORKDIR ./frontend
RUN npm run build

WORKDIR ../backend

EXPOSE 8000

CMD ["npm", "start"]
