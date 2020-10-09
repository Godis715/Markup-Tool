import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinTable,
    ManyToMany
} from "typeorm";

import { Role } from "./Role";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        unique: true
    })
    login: string;

    @Column()
    passwordHash: string;

    @ManyToMany(type => Role)
    @JoinTable()
    roles: Role[];
}
