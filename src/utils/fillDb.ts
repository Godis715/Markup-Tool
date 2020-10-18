import "reflect-metadata";
import { Role } from "../entity/Role";
import { getManager } from "typeorm";
import { UserRole } from "../enums/appEnums";

(async () => {
    const manager = getManager();

    const roles = Object.values(UserRole).map(
        (roleName) => {
            const newRole = new Role();
            newRole.name = roleName;
            return newRole;
        }
    );

    await manager.save(roles);
})();
