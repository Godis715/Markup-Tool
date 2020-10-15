import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne, OneToMany
} from "typeorm";
import { DatasetItem } from "./DatasetItem";
import { User } from "./User";
import { IsNotEmpty } from "class-validator";
import { Markup } from "./Markup";

@Entity()
export class Dataset {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * TODO:
     * продумать, какие названия могут быть у датасетов
     * реализовать более "умную валидацию"
     */
    @IsNotEmpty({ message: "Dataset name mustn't be empty" })
    @Column({ unique: true })
    name: string;

    /**
     * TODO:
     * можно сделать проверку, является ли строка корректным путем
     * также в DatasetItem
     */
    @IsNotEmpty({ message: "Dataset location mustn't be empty" })
    @Column({ unique: true })
    location: string;

    @ManyToOne(() => User, (user) => user.datasets)
    user: User;

    @OneToMany(() => DatasetItem, (datasetItem) => datasetItem.dataset)
    items: DatasetItem[];

    @OneToMany(() => Markup, (markup) => markup.dataset)
    markups: Markup[];
} 
