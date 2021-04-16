import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany
} from "typeorm";
import { DatasetItem } from "./DatasetItem";
import { Markup } from "./Markup";
import MarkupItemResult from "../apiServer/validationDecorators/markupItemResult";
import { Vote } from "./Vote";

@Entity()
export class Prediction {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Markup, (markup) => markup.items)
    markup!: Markup;

    @Column()
    modelId!: string;

    @ManyToOne(() => DatasetItem, (datasetItem) => datasetItem.markupItems)
    @JoinColumn()
    datasetItem!: DatasetItem;

    /**
     * TODO:
     * сделать так, чтобы у различных типов заданий
     * был различный тип результатов
     * лучше проработать представление результатов
     * 
     * Пока что можно хранить как JSON
     */
    @MarkupItemResult()
    @Column("simple-json")
    result: any;

    @OneToMany(() => Vote, (vote) => vote.prediction)
    votes!: Vote[]
}
