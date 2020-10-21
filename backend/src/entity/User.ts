import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinTable,
    ManyToMany, OneToMany, PrimaryColumn
} from "typeorm";
import { Dataset } from "./Dataset";
import { Length } from "class-validator";

import { Role } from "./Role";
import { Markup } from "./Markup";
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
    @ArrayUniqueByProp("id")
    roles: Role[];

    @OneToMany(() => Dataset, (dataset) => dataset.user)
    datasets: Dataset[];
}
