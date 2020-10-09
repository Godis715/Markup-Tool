import "reflect-metadata";
import { Role } from "./entity/Role";
import { createConnection } from "typeorm";
import { ROLE_ADMIN, ROLE_CUSTOMER, ROLE_EXPERT } from "./configs";

(async () => {
    const customer = new Role();
    customer.name = ROLE_CUSTOMER;

    const expert = new Role();
    expert.name = ROLE_EXPERT;

    const admin = new Role();
    admin.name = ROLE_ADMIN;

    const connection = await createConnection();
    await connection.manager.save([customer, expert, admin]);
    await connection.close();
})();
