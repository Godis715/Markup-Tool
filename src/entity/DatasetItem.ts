import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne
} from "typeorm";
import { Dataset } from "./Dataset";

@Entity()
export class DatasetItem {
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

    @ManyToOne(() => Dataset, (dataset) => dataset.items)
    dataset: Dataset;
}
