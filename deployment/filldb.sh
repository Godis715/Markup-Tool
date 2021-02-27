docker exec -it "$(docker-compose ps -q app)" bash -c "npm run typeorm migration:run; \
node ./node_modules/ts-node/dist/bin.js ./src/utils/fillDb.ts"
