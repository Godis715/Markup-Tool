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
import { Markup } from "./Markup";

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
    roles: Role[];

    @OneToMany(() => Dataset, (dataset) => dataset.user)
    datasets: Dataset[];

    /**
     * Это поле может содержать значения, только если пользователь - эксперт
     * Оно нужно, чтобы быстро получать разметки, в которых пользователь выступает экспертом
     */
    @ManyToMany(() => Markup, (markup) => markup.experts)
    relatedMarkups?: Markup[];
}
