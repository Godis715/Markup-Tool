import {
    Entity,
    Column,
    PrimaryColumn
} from "typeorm";

export enum ModelStatus {
    TRAINING = "training",
    READY = "ready",
    FAILURE = "failure"
}

@Entity()
export class Model {
    @PrimaryColumn("uuid")
    id!: string;

    @Column()
    markupId!: string;

    @Column()
    markupType!: string;

    @Column()
    timestamp!: Date;

    @Column({ nullable: true })
    weightsPath?: string;

    @Column("text")
    status!: ModelStatus;
}
