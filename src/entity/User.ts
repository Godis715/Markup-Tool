import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinTable,
    ManyToMany, OneToMany
} from "typeorm";
import { Dataset } from "./Dataset";
import { Length } from "class-validator";

import { Role } from "./Role";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Length(5, 10, { message: "Length of a login must be between 5 and 20 characters." })
    @Column({ unique: true })
    login: string;

    @Column()
    passwordHash: string;

    @ManyToMany((type) => Role)
    @JoinTable()
    roles: Role[];

    @OneToMany(() => Dataset, (dataset) => dataset.user)
    datasets: Dataset[]
}
