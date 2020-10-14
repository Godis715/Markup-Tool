import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    Unique
} from "typeorm";
import { Dataset } from "./Dataset";

@Entity()
@Unique(["name", "dataset"])
export class DatasetItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column({
        unique: true
    })
    location: string;

    @ManyToOne(() => Dataset, (dataset) => dataset.items)
    dataset: Dataset;
}
