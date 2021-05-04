FROM node:12

# installing deps for frontend
WORKDIR /usr/app
COPY frontend/package*.json ./
RUN npm install && mkdir frontend && mv ./package*.json ./node_modules ./frontend

# installing deps for backend
COPY markup-service/package*.json ./
RUN npm install && mkdir markup-service && mv ./package*.json ./node_modules ./markup-service

# installing deps for admin CLI
COPY markup-service/admin-cli/package*.json ./
RUN npm install && mkdir markup-service/admin-cli && mv ./package*.json ./node_modules ./markup-service/admin-cli

# building frontend
WORKDIR /usr/app/frontend
COPY ./frontend .
ENV REACT_APP_BASE_URL=http://localhost:8000
RUN npm run build

WORKDIR /usr/app/markup-service
COPY ./markup-service .

EXPOSE 8000

CMD ["npm", "start"]
