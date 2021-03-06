import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinTable,
    CreateDateColumn
} from "typeorm";
import { IsIn, IsInt, Min } from "class-validator";
import { Dataset } from "./Dataset";
import { MarkupItem } from "./MarkupItem";
import { User } from "./User" ;
import { MarkupTypeEnum } from "../types/markup";
import MarkupConfig from "../api/validationDecorators/markupConfig";

/**
 * Сущность, представляющая собой задание для экспертов на разметку и
 * непосредственно разметку данных, полученную в итоге
 * 
 * Владельцем данной задачи является владелец датасета
 * 
 * TODO:
 * - Добавить поле "название" для задания
 */
@Entity()
export class Markup {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // одному датасету может соответствовать несколько разметок
    @ManyToOne(() => Dataset, (dataset) => dataset.markups)
    dataset!: Dataset;

    @Column()
    @IsIn(Object.values(MarkupTypeEnum), {
        message: (args) => `Invalid markup type '${args.value}'`
    })
    type!: string;

    @OneToMany(() => MarkupItem, (markupItem) => markupItem.markup)
    items!: MarkupItem[];

    @Column()
    @IsInt()
    @Min(1)
    minExpertsPerTask!: number;

    // эксперты, назначенные на выполнение задачи
    @ManyToMany(() => User)
    @JoinTable()
    experts!: User[];

    @Column()
    description!: string;

    @MarkupConfig()
    @Column("simple-json", { nullable: true })
    config?: any;

    @CreateDateColumn()
    createDate!: Date;
}
