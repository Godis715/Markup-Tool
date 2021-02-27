FROM node:12

WORKDIR /usr/app
COPY . .

ENV REACT_APP_BASE_URL=http://localhost:8000
WORKDIR ./frontend
RUN npm install; \
    npm run build

WORKDIR ../backend
RUN npm install

EXPOSE 8000

CMD ["npm", "start"]
