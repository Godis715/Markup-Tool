import {MigrationInterface, QueryRunner} from "typeorm";
export class InitialMigration1603042223898 implements MigrationInterface {
    name = 'InitialMigration1603042223898'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "role" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "markup_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "result" text NOT NULL, "markupId" uuid, "expertId" uuid, "datasetItemId" uuid, CONSTRAINT "PK_57ede04da5ece947e341888fee6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "markup" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "datasetId" uuid, CONSTRAINT "PK_538ba7ba13a4674c798e546b9a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "login" character varying NOT NULL, "passwordHash" character varying NOT NULL, CONSTRAINT "UQ_a62473490b3e4578fd683235c5e" UNIQUE ("login"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "dataset" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "location" character varying NOT NULL, "userId" uuid, CONSTRAINT "UQ_109fd11edd246e0465d2e7e76a1" UNIQUE ("name"), CONSTRAINT "UQ_c9876b071b5eda128470009ba62" UNIQUE ("location"), CONSTRAINT "PK_36c1c67adb3d1dd69ae57f18913" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "dataset_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "location" character varying NOT NULL, "datasetId" uuid, CONSTRAINT "UQ_359ad62ff5e26517b3355035c4f" UNIQUE ("location"), CONSTRAINT "UQ_3b64fc2f99d40cb1deb32356c25" UNIQUE ("name", "datasetId"), CONSTRAINT "PK_3b6253921926253dd6610fa15cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "appointment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expertId" uuid, "markupId" uuid, "datasetItemId" uuid, CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "markup_experts_user" ("markupId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_33a883b28298ad0c3033cd2f532" PRIMARY KEY ("markupId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1fce17ca9b8d3aaf2f01e23ef0" ON "markup_experts_user" ("markupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_00e853c5d11f64296e6d5b20be" ON "markup_experts_user" ("userId") `);
        await queryRunner.query(`CREATE TABLE "user_roles_role" ("userId" uuid NOT NULL, "roleId" integer NOT NULL, CONSTRAINT "PK_b47cd6c84ee205ac5a713718292" PRIMARY KEY ("userId", "roleId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5f9286e6c25594c6b88c108db7" ON "user_roles_role" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4be2f7adf862634f5f803d246b" ON "user_roles_role" ("roleId") `);
        await queryRunner.query(`ALTER TABLE "markup_item" ADD CONSTRAINT "FK_71b3e13d3f11c5b125e7b878473" FOREIGN KEY ("markupId") REFERENCES "markup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "markup_item" ADD CONSTRAINT "FK_eac59f23f5af5a6658de5d6bfa7" FOREIGN KEY ("expertId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "markup_item" ADD CONSTRAINT "FK_d0ea70ed146c4c8c03d2265bc45" FOREIGN KEY ("datasetItemId") REFERENCES "dataset_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "markup" ADD CONSTRAINT "FK_34c48cb1555f67b12048721d065" FOREIGN KEY ("datasetId") REFERENCES "dataset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dataset" ADD CONSTRAINT "FK_e5bc78381eaa289297461444421" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dataset_item" ADD CONSTRAINT "FK_cd2d849f63428db38033d37aae8" FOREIGN KEY ("datasetId") REFERENCES "dataset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_4d7cd5ed6bc8de649523e42222d" FOREIGN KEY ("expertId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_970cab5488e57368be9aca94c44" FOREIGN KEY ("markupId") REFERENCES "markup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_32bd8fccd1a4a51651c467d356e" FOREIGN KEY ("datasetItemId") REFERENCES "dataset_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "markup_experts_user" ADD CONSTRAINT "FK_1fce17ca9b8d3aaf2f01e23ef0e" FOREIGN KEY ("markupId") REFERENCES "markup"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "markup_experts_user" ADD CONSTRAINT "FK_00e853c5d11f64296e6d5b20be2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" ADD CONSTRAINT "FK_5f9286e6c25594c6b88c108db77" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" ADD CONSTRAINT "FK_4be2f7adf862634f5f803d246b8" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles_role" DROP CONSTRAINT "FK_4be2f7adf862634f5f803d246b8"`);
        await queryRunner.query(`ALTER TABLE "user_roles_role" DROP CONSTRAINT "FK_5f9286e6c25594c6b88c108db77"`);
        await queryRunner.query(`ALTER TABLE "markup_experts_user" DROP CONSTRAINT "FK_00e853c5d11f64296e6d5b20be2"`);
        await queryRunner.query(`ALTER TABLE "markup_experts_user" DROP CONSTRAINT "FK_1fce17ca9b8d3aaf2f01e23ef0e"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_32bd8fccd1a4a51651c467d356e"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_970cab5488e57368be9aca94c44"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_4d7cd5ed6bc8de649523e42222d"`);
        await queryRunner.query(`ALTER TABLE "dataset_item" DROP CONSTRAINT "FK_cd2d849f63428db38033d37aae8"`);
        await queryRunner.query(`ALTER TABLE "dataset" DROP CONSTRAINT "FK_e5bc78381eaa289297461444421"`);
        await queryRunner.query(`ALTER TABLE "markup" DROP CONSTRAINT "FK_34c48cb1555f67b12048721d065"`);
        await queryRunner.query(`ALTER TABLE "markup_item" DROP CONSTRAINT "FK_d0ea70ed146c4c8c03d2265bc45"`);
        await queryRunner.query(`ALTER TABLE "markup_item" DROP CONSTRAINT "FK_eac59f23f5af5a6658de5d6bfa7"`);
        await queryRunner.query(`ALTER TABLE "markup_item" DROP CONSTRAINT "FK_71b3e13d3f11c5b125e7b878473"`);
        await queryRunner.query(`DROP INDEX "IDX_4be2f7adf862634f5f803d246b"`);
        await queryRunner.query(`DROP INDEX "IDX_5f9286e6c25594c6b88c108db7"`);
        await queryRunner.query(`DROP TABLE "user_roles_role"`);
        await queryRunner.query(`DROP INDEX "IDX_00e853c5d11f64296e6d5b20be"`);
        await queryRunner.query(`DROP INDEX "IDX_1fce17ca9b8d3aaf2f01e23ef0"`);
        await queryRunner.query(`DROP TABLE "markup_experts_user"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
        await queryRunner.query(`DROP TABLE "dataset_item"`);
        await queryRunner.query(`DROP TABLE "dataset"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "markup"`);
        await queryRunner.query(`DROP TABLE "markup_item"`);
        await queryRunner.query(`DROP TABLE "role"`);
    }

}
