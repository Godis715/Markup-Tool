import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from "typeorm";

enum ModelStatus {
    "training",
    "ready",
    "failure"
}

@Entity()
export class Model {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    markupId!: string;

    @Column()
    timestamp!: Date;

    @Column({ nullable: true })
    weightsPath?: string;

    @Column("text")
    status!: ModelStatus;
}
