import commander from "commander";
import { prompt } from "inquirer";
import jwt from "jsonwebtoken";
import { UserRole } from "../src/enums/appEnums";
import * as auth from "../src/utils/auth";

commander
    .version("1.0.0")
    .description("CLI administration panel.");

commander
    .command("create-user [login]")
    .option("--expert")
    .option("--customer")
    .option("--admin")
    .description("Create new user with specified name")
    .action(
        async (login, cmd) => {
            const { password } = await prompt([
                {
                    type: "password",
                    mask: "*",
                    message: "Enter a password",
                    name: "password"
                }
            ]);

            const roles = [];
            if (cmd.expert) {
                roles.push(UserRole.EXPERT);
            }

            if (cmd.customer) {
                roles.push(UserRole.CUSTOMER);
            }

            if (cmd.admin) {
                roles.push(UserRole.ADMIN);
            }

            try {
                await auth.createUser(login, password, roles);
                console.log("User has been successfully created.");
            }
            catch(err) {
                logError(err);
            }
        }
    );

commander
    .command("get-token")
    .description("Command generate refresh and access tokens by login and password")
    .action(
        async () => {
            const { login, password } = await prompt([
                {
                    type: "input",
                    message: "Enter login",
                    name: "login"
                },
                {
                    type: "password",
                    mask: "*",
                    message: "Enter password",
                    name: "password"
                }
            ]);

            try {
                const tokens = await auth.generateTokens(login, password);
                console.log(`Access: ${tokens.accessToken}`);
                console.log(`Refresh: ${tokens.refreshToken}`);
                console.log(`Csrf-Access: ${tokens.csrfAccessToken}`);
                console.log(`Csrf-Refresh: ${tokens.csrfRefreshToken}`);
            }
            catch(err) {
                logError(err);
            }
        }
    );

commander
    .command("check-token [token] [csrf-token]")
    .description("Check if access token is valid")
    .action(
        async (token, csrfToken) => {
            try {
                auth.verifyTokens(token, csrfToken);
                const { login, type } = jwt.decode(token) as auth.JWTPayload;

                console.log("Token is valid.");
                console.log(`Login: ${login}`);
                console.log(`Token type: ${type}`);
            }
            catch(err) {
                logError(err);
            }
        }
    );

commander
    .command("refresh-token [token] [csrf-token]")
    .description("Refresh access token using refresh token")
    .action(
        async (refreshToken, csrfRefreshToken) => {
            try {
                const tokens = await auth.generateAccessTokens(refreshToken, csrfRefreshToken);

                console.log(`Access: ${tokens.accessToken}`);
                console.log(`Csrf-Access: ${tokens.csrfAccessToken}`);
            }
            catch(err) {
                logError(err);
            }
        }
    )

commander.parse(process.argv);

function logError(error: Error | Error[]) {
    if (Array.isArray(error)) {
        error.forEach(
            (err) => logSingleError(err)
        );
    }
    else {
        logSingleError(error);
    }
}

function logSingleError(error: Error) {
    console.error(error.message || error);
}
