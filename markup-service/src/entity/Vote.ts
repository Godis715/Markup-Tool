import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne
} from "typeorm";
import { MarkupItem } from "./MarkupItem";
import { Prediction } from "./Prediction";
import { User } from "./User";

@Entity()
export class Vote {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Prediction, (prediction) => prediction.votes, { nullable: true })
    prediction?: Prediction;

    @ManyToOne(() => MarkupItem, undefined, { nullable: true })
    markupItem?: MarkupItem;

    @Column()
    isCorrect!: boolean;

    @ManyToOne(() => User)
    expert!: User;
}
