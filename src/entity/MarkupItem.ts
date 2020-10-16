import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { DatasetItem } from "./DatasetItem";
import { Markup } from "./Markup";
import { User } from "./User";
import { IsJSON, IsNotEmpty } from "class-validator";

@Entity()
export class MarkupItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Markup, (markup) => markup.items)
    markup: Markup;

    @ManyToOne(() => User)
    @JoinColumn()
    expert: User;

    @ManyToOne(() => DatasetItem)
    @JoinColumn()
    datasetItem: DatasetItem;

    /**
     * TODO:
     * сделать так, чтобы у различных типов заданий
     * был различный тип результатов
     * лучше проработать представление результатов
     * 
     * Пока что можно хранить как JSON
     */
    @Column()
    @IsJSON()
    @IsNotEmpty()
    result: string;
}
