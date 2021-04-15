import { IsNotEmpty } from "class-validator";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    Unique,
    OneToMany
} from "typeorm";
import { Dataset } from "./Dataset";
import { MarkupItem } from "./MarkupItem";

@Entity()
@Unique(["name", "dataset"])
export class DatasetItem {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @IsNotEmpty({ message: "Dataset item's name mustn't be empty" })
    // не является первичным ключом
    @Column()
    name!: string;

    // путь включает себя папку, в которой лежит датасет
    @IsNotEmpty({ message: "Dataset item's location mustn't be empty" })
    @Column({ unique: true })
    location!: string;

    @ManyToOne(() => Dataset, (dataset) => dataset.items)
    dataset!: Dataset;

    @OneToMany(() => MarkupItem, (markup) => markup.datasetItem)
    markupItems!: MarkupItem[];
}
