import "reflect-metadata";
import { Role } from "../entity/Role";
import { createConnection } from "typeorm";
import { UserRole } from "../types/role";


(async () => {
    const connection = await createConnection();

    const roles = Object.values(UserRole).map(
        (roleName) => {
            const newRole = new Role();
            newRole.name = roleName;
            return newRole;
        }
    );

    await connection.manager.save(roles);
})();
