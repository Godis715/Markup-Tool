import {MigrationInterface, QueryRunner} from "typeorm";

export class createDates1603738104079 implements MigrationInterface {
    name = 'createDates1603738104079'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "markup" ADD "createDate" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "dataset" ADD "uploadDate" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dataset" DROP COLUMN "uploadDate"`);
        await queryRunner.query(`ALTER TABLE "markup" DROP COLUMN "createDate"`);
    }

}
