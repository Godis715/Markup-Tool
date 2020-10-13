import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinTable,
    ManyToMany, OneToMany
} from "typeorm";
import { Dataset } from "./Dataset";

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

    @OneToMany(() => Dataset, (dataset) => dataset.user)
    datasets: Dataset[]
}
