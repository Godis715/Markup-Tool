export SECRET_KEY=12345
export REACT_APP_API_URL=localhost:8000
export NODE_ENV=production
cd frontend
npm i
npm run build
cd ../backend
npm i
npx ts-node src/utils/fillDb.ts || true
npm start
