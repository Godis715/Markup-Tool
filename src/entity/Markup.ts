import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    ManyToMany, JoinTable
} from "typeorm";
import { IsIn } from "class-validator";
import { Dataset } from "./Dataset";
import { MarkupItem } from "./MarkupItem";
import { User } from "./User" ;
import { MarkupType } from "../enums/appEnums";
import MarkupConfig from "../validationDecorators/markupConfig";

/**
 * Сущность, представляющая собой задание для экспертов на разметку и
 * непосредственно разметку данных, полученную в итоге
 * 
 * Владельцем данной задачи является владелец датасета
 * 
 * TODO:
 * - Добавить поле "название" для задания
 * - Добавить поле "описание" для задания
 */
@Entity()
export class Markup {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    // одному датасету может соответствовать несколько разметок
    @ManyToOne(() => Dataset, (dataset) => dataset.markups)
    dataset: Dataset;

    @Column()
    @IsIn(Object.values(MarkupType), {
        message: (args) => `Invalid markup type '${args.value}'`
    })
    type: string;

    @OneToMany(() => MarkupItem, (markupItem) => markupItem.markup)
    items: MarkupItem[];

    // эксперты, назначенные на выполнение задачи
    @ManyToMany(() => User, (expert) => expert.relatedMarkups)
    @JoinTable()
    experts: User[];

    @MarkupConfig()
    @Column("simple-json", { nullable: true })
    config?: any;
}
