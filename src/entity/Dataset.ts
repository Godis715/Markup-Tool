import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne, OneToMany
} from "typeorm";
import { DatasetItem } from "./DatasetItem";
import { User } from "./User";

@Entity()
export class Dataset {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        unique: true
    })
    name: string;

    @Column({
        unique: true
    })
    location: string;

    @ManyToOne(() => User, (user) => user.datasets)
    user: User;

    @OneToMany(() => DatasetItem, (datasetItem) => datasetItem.dataset)
    items: DatasetItem[]
}
