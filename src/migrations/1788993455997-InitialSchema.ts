import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788993455997 implements MigrationInterface {
  name = 'InitialSchema1788993455997';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(15) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "operators" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "contact_email" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_3d02b3692836893720335a79d1b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."buses_bus_type_enum" AS ENUM('AC_SLEEPER', 'NON_AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "buses" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "operator_id" integer NOT NULL, "registration_number" character varying(20) NOT NULL, "bus_type" "public"."buses_bus_type_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_c0cabb8e70462ec3b9e81a4b7b9" UNIQUE ("registration_number"), CONSTRAINT "PK_ddebc0eeba64a019ae072975947" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cities" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "state" character varying(100) NOT NULL, CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_city_name_state" ON "cities"  ("name", "state") `,
    );
    await queryRunner.query(
      `CREATE TABLE "routes" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "from_city_id" integer NOT NULL, "to_city_id" integer NOT NULL, "distance_km" integer NOT NULL, "duration_minutes" integer NOT NULL, CONSTRAINT "PK_76100511cdfa1d013c859f01d8b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_route_cities" ON "routes"  ("from_city_id", "to_city_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."trips_status_enum" AS ENUM('SCHEDULED', 'DEPARTED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "trips" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "bus_id" integer NOT NULL, "route_id" integer NOT NULL, "departure_time" TIMESTAMP WITH TIME ZONE NOT NULL, "arrival_time" TIMESTAMP WITH TIME ZONE NOT NULL, "fare" numeric(10,2) NOT NULL, "status" "public"."trips_status_enum" NOT NULL DEFAULT 'SCHEDULED', CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_trip_route_departure" ON "trips"  ("route_id", "departure_time") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bookings_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "bookings" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "user_id" integer NOT NULL, "trip_id" integer NOT NULL, "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'PENDING', "total_amount" numeric(10,2) NOT NULL, CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_booking_user" ON "bookings"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."seats_seat_type_enum" AS ENUM('SLEEPER', 'SEMI_SLEEPER', 'REGULAR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."seats_deck_enum" AS ENUM('UPPER', 'LOWER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "seats" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "bus_id" integer NOT NULL, "seat_number" character varying(5) NOT NULL, "seat_type" "public"."seats_seat_type_enum" NOT NULL, "deck" "public"."seats_deck_enum" NOT NULL, CONSTRAINT "PK_3fbc74bb4638600c506dcb777a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_bus_seat" ON "seats"  ("bus_id", "seat_number") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."booking_seats_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "booking_seats" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "booking_id" integer NOT NULL, "trip_id" integer NOT NULL, "seat_id" integer NOT NULL, "passenger_name" character varying(255) NOT NULL, "age" integer NOT NULL, "gender" "public"."booking_seats_gender_enum", CONSTRAINT "check_valid_age" CHECK (age > 0 and age < 100), CONSTRAINT "PK_a4d929dea33a0153ba9bc253db1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_trip_seat" ON "booking_seats"  ("trip_id", "seat_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('UNPAID', 'PAID', 'FAILED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "booking_id" integer NOT NULL, "amount" numeric(10,2) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'UNPAID', "transaction_ref" character varying(100), "paid_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payment_booking" ON "payments"  ("booking_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" ADD CONSTRAINT "FK_a5d51574b60f8848d203e5f4241" FOREIGN KEY ("operator_id") REFERENCES "operators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "routes" ADD CONSTRAINT "FK_50ea813f27d26f35a81cac611a5" FOREIGN KEY ("from_city_id") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "routes" ADD CONSTRAINT "FK_8099abc90b3cff708ddbe3d94f1" FOREIGN KEY ("to_city_id") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_de94f3218372c5bdfe1638c07c3" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_e49dbbd9991c9b7baec9779e7ce" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_64cd97487c5c42806458ab5520c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_45fa98a28a6944e39d8a5754bd1" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seats" ADD CONSTRAINT "FK_63891430d84257508216445c058" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_seats" ADD CONSTRAINT "FK_25c8b5c1e010af1cd2f699c5926" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_seats" ADD CONSTRAINT "FK_84268d810180ab1356a57ee78db" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_seats" ADD CONSTRAINT "FK_ce3eaf629a9df599803acd0d936" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_seats" DROP CONSTRAINT "FK_ce3eaf629a9df599803acd0d936"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_seats" DROP CONSTRAINT "FK_84268d810180ab1356a57ee78db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_seats" DROP CONSTRAINT "FK_25c8b5c1e010af1cd2f699c5926"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seats" DROP CONSTRAINT "FK_63891430d84257508216445c058"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_45fa98a28a6944e39d8a5754bd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_64cd97487c5c42806458ab5520c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_e49dbbd9991c9b7baec9779e7ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_de94f3218372c5bdfe1638c07c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "routes" DROP CONSTRAINT "FK_8099abc90b3cff708ddbe3d94f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "routes" DROP CONSTRAINT "FK_50ea813f27d26f35a81cac611a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" DROP CONSTRAINT "FK_a5d51574b60f8848d203e5f4241"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_payment_booking"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_trip_seat"`);
    await queryRunner.query(`DROP TABLE "booking_seats"`);
    await queryRunner.query(`DROP TYPE "public"."booking_seats_gender_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_bus_seat"`);
    await queryRunner.query(`DROP TABLE "seats"`);
    await queryRunner.query(`DROP TYPE "public"."seats_deck_enum"`);
    await queryRunner.query(`DROP TYPE "public"."seats_seat_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_booking_user"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_trip_route_departure"`);
    await queryRunner.query(`DROP TABLE "trips"`);
    await queryRunner.query(`DROP TYPE "public"."trips_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_route_cities"`);
    await queryRunner.query(`DROP TABLE "routes"`);
    await queryRunner.query(`DROP INDEX "public"."uq_city_name_state"`);
    await queryRunner.query(`DROP TABLE "cities"`);
    await queryRunner.query(`DROP TABLE "buses"`);
    await queryRunner.query(`DROP TYPE "public"."buses_bus_type_enum"`);
    await queryRunner.query(`DROP TABLE "operators"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
