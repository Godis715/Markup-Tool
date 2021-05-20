import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne
} from "typeorm";
import { Prediction } from "./Prediction";
import { User } from "./User";

@Entity()
export class Vote {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Prediction, (prediction) => prediction.votes, { nullable: true })
    prediction?: Prediction;

    @Column()
    isCorrect!: boolean;

    @ManyToOne(() => User)
    expert!: User;
}
