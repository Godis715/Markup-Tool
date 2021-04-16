import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { DatasetItem } from "./DatasetItem";
import { Markup } from "./Markup";
import { User } from "./User";

export enum AppointmentType {
    MARKUP = "markup",
    MARKUP_VALIDATION = "markup-validation",
    PREDICTION_VALIDATION = "prediction-validation"
}

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column("text")
    type!: AppointmentType;

    @ManyToOne(() => User)
    expert!: User;

    @ManyToOne(() => Markup)
    markup!: Markup;

    @ManyToOne(() => DatasetItem)
    datasetItem!: DatasetItem;
}
