FROM node:12

WORKDIR /usr/app
COPY frontend/package.json frontend/package-lock.json ./
COPY ./frontend ./frontend
RUN npm install && mv ./package.json ./package-lock.json ./node_modules ./frontend

COPY backend/package.json backend/package-lock.json ./
COPY ./backend ./backend
RUN npm install && mv ./package.json ./package-lock.json ./node_modules ./backend

WORKDIR /usr/app/frontend
ENV REACT_APP_BASE_URL=http://localhost:8000
RUN npm run build

WORKDIR /usr/app/backend

EXPOSE 8000

CMD ["npm", "start"]
