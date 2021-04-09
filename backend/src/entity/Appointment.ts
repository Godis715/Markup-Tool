import {
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { DatasetItem } from "./DatasetItem";
import { Markup } from "./Markup";
import { User } from "./User";

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User)
    expert!: User;

    @ManyToOne(() => Markup)
    markup!: Markup;

    @ManyToOne(() => DatasetItem)
    datasetItem!: DatasetItem;
}
