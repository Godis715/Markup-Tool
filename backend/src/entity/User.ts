import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinTable,
    ManyToMany,
    OneToMany
} from "typeorm";
import { Dataset } from "./Dataset";
import { Length } from "class-validator";

import { Role } from "./Role";
import ArrayUniqueByProp from "../validationDecorators/arrayUniqueByProp";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    @Length(5, 10, { message: "Length of a login must be between 5 and 20 characters." })
    login: string;

    @Column()
    passwordHash: string;

    @ManyToMany((type) => Role)
    @JoinTable()
    @ArrayUniqueByProp("id", { message: "User must have unique roles" })
    roles: Role[];

    @OneToMany(() => Dataset, (dataset) => dataset.user)
    datasets: Dataset[];
}
