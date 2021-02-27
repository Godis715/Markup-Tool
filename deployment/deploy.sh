# deploying the application
docker-compose build

# running the app and waiting until the server starts
docker-compose up & \
until $(curl --silent --output /dev/null --head --fail "http://localhost:8000"); do
    sleep 1
done

# filling database
sh filldb.sh

# stopping the app
docker-compose stop
