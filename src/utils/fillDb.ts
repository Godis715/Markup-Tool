import "reflect-metadata";
import { Role } from "../entity/Role";
import { createConnection } from "typeorm";
import { UserRole } from "../enums/appEnums";
import { User } from "../entity/User";

(async () => {
    const customer = new Role();
    customer.name = UserRole.CUSTOMER;

    const expert = new Role();
    expert.name = UserRole.EXPERT;

    const admin = new Role();
    admin.name = UserRole.ADMIN;

    const connection = await createConnection();
    await connection.manager.save([customer, expert, admin]);
    await connection.close();
})();
