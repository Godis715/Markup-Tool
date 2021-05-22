import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn
} from "typeorm";
import { DatasetItem } from "./DatasetItem";
import { Markup } from "./Markup";
import MarkupItemResult from "../api/validationDecorators/markupItemResult";
import { Vote } from "./Vote";
import { MarkupItemResult as MarkupItemResultType } from "../types/markupItem";

@Entity()
export class Prediction {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Markup, (markup) => markup.items)
    markup!: Markup;

    @Column()
    modelId!: string;

    @ManyToOne(() => DatasetItem, { eager: true })
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
    result!: MarkupItemResultType;

    @OneToMany(() => Vote, (vote) => vote.prediction)
    votes!: Vote[];

    @CreateDateColumn()
    createDate!: Date;
}
