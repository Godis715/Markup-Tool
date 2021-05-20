import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
} from "typeorm";
import { DatasetItem } from "./DatasetItem";
import { Markup } from "./Markup";
import { User } from "./User";
import MarkupItemResult from "../api/validationDecorators/markupItemResult";
import { MarkupItemResult as MarkupItemResultType } from "../types/markupItem";

@Entity()
export class MarkupItem {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Markup, (markup) => markup.items)
    markup!: Markup;

    @ManyToOne(() => User)
    @JoinColumn()
    expert!: User;

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
    result!: MarkupItemResultType;

    @CreateDateColumn()
    createDate!: Date;
}
