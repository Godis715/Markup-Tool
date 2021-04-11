console.log(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USERNAME, process.env.DB_PASSWORD, process.env.DB_NAME);

module.exports = {
    "type": "postgres",
    "host": process.env.DB_HOST,
    "port": process.env.DB_PORT,
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "synchronize": true,
    "logging": false,
    "entities": [
        `${__dirname}/src/entity/**/*.ts`
    ],
    "migrations": [
        `${__dirname}/src/migration/**/*.ts`
    ],
    "subscribers": [
        `${__dirname}/src/subscriber/**/*.ts`
    ],
    "cli": {
        "entitiesDir": "src/entity",
        "migrationsDir": "src/migration",
        "subscribersDir": "src/subscriber"
    }
}
