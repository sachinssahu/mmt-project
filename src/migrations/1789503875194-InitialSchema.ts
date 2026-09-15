import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1789503875194 implements MigrationInterface {
  name = 'InitialSchema1789503875194';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(15) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bookings_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'PARTIALLY_CANCELLED', 'CANCELLED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "bookings" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "user_id" integer NOT NULL, "pnr" character varying(10) NOT NULL, "is_break_journey" boolean NOT NULL DEFAULT false, "hold_expires_at" TIMESTAMP WITH TIME ZONE, "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'PENDING', "total_amount" numeric(10,2) NOT NULL, CONSTRAINT "UQ_5284b2f2251fc932370aa41d13d" UNIQUE ("pnr"), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_booking_sweeper" ON "bookings"  ("status", "hold_expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_booking_user" ON "bookings"  ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "operators" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "contact_email" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_by_user_id" integer NOT NULL, CONSTRAINT "PK_3d02b3692836893720335a79d1b" PRIMARY KEY ("id"))`,
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
      `CREATE TYPE "public"."routes_direction_enum" AS ENUM('ONWARD', 'RETURN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "routes" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "operator_id" integer NOT NULL, "name" character varying(150) NOT NULL, "from_city_id" integer NOT NULL, "to_city_id" integer NOT NULL, "service_group" character varying(50) NOT NULL, "direction" "public"."routes_direction_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_76100511cdfa1d013c859f01d8b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_route_service_group" ON "routes"  ("service_group") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_route_operator" ON "routes"  ("operator_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_route_city_pair" ON "routes"  ("from_city_id", "to_city_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."trips_status_enum" AS ENUM('SCHEDULED', 'DEPARTED', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "trips" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "bus_id" integer NOT NULL, "route_id" integer NOT NULL, "service_date" date NOT NULL, "base_departure_at" TIMESTAMP WITH TIME ZONE NOT NULL, "fare_multiplier" numeric(4,2) NOT NULL DEFAULT '1', "status" "public"."trips_status_enum" NOT NULL DEFAULT 'SCHEDULED', CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_trip_route_date" ON "trips"  ("route_id", "service_date") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_bus_not_double_booked" ON "trips"  ("bus_id", "base_departure_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."booking_legs_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "booking_legs" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "booking_id" integer NOT NULL, "trip_id" integer NOT NULL, "leg_order" smallint NOT NULL, "from_seq" smallint NOT NULL, "to_seq" smallint NOT NULL, "amount" numeric(10,2) NOT NULL, "status" "public"."booking_legs_status_enum" NOT NULL DEFAULT 'PENDING', CONSTRAINT "chk_leg_seq_order" CHECK (to_seq > from_seq), CONSTRAINT "PK_cafec35fadaef515a1e6796f3d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_leg_trip" ON "booking_legs"  ("trip_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_leg_order" ON "booking_legs"  ("booking_id", "leg_order") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."passengers_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "passengers" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "booking_id" integer NOT NULL, "name" character varying(255) NOT NULL, "age" smallint NOT NULL, "gender" "public"."passengers_gender_enum" NOT NULL, CONSTRAINT "chk_passenger_age" CHECK (age > 0 and age < 120), CONSTRAINT "PK_9863c72acd866e4529f65c6c98c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_passenger_booking_id" ON "passengers"  ("booking_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."seats_seat_type_enum" AS ENUM('SLEEPER', 'SEMI_SLEEPER', 'SEATER')`,
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
      `CREATE TYPE "public"."seat_bookings_status_enum" AS ENUM('HELD', 'CONFIRMED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "seat_bookings" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "booking_leg_id" integer NOT NULL, "trip_id" integer NOT NULL, "seat_id" integer NOT NULL, "passenger_id" integer NOT NULL, "from_seq" smallint NOT NULL, "to_seq" smallint NOT NULL, "status" "public"."seat_bookings_status_enum" NOT NULL DEFAULT 'HELD', CONSTRAINT "chk_seat_booking_seq_order" CHECK (to_seq > from_seq), CONSTRAINT "PK_4eff3f7a225945e36d1509d2a94" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_seat_booking_leg" ON "seat_bookings"  ("booking_leg_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_seat_availability" ON "seat_bookings"  ("trip_id", "seat_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('UNPAID', 'PAID', 'FAILED', 'REFUNDED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "booking_id" integer NOT NULL, "amount" numeric(10,2) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'UNPAID', "transaction_ref" character varying(100), "paid_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_c9f713bf30bb8bcea32a5df5167" UNIQUE ("transaction_ref"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payment_booking" ON "payments"  ("booking_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "route_fares" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "route_id" integer NOT NULL, "from_seq" smallint NOT NULL, "to_seq" smallint NOT NULL, "base_fare" numeric(10,2) NOT NULL, CONSTRAINT "chk_route_fare_seq_order" CHECK (to_seq > from_seq), CONSTRAINT "PK_426fba162ed7ece39d288cc2ccd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_route_fare_segment" ON "route_fares"  ("route_id", "from_seq", "to_seq") `,
    );
    await queryRunner.query(
      `CREATE TABLE "stops" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "city_id" integer NOT NULL, "name" character varying(150) NOT NULL, "address" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_ed1be877403ad3c921b07f62ca5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_stop_city" ON "stops"  ("city_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_stop_city_name" ON "stops"  ("city_id", "name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "route_stops" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "route_id" integer NOT NULL, "stop_id" integer NOT NULL, "seq" smallint NOT NULL, "arrival_offset_min" integer NOT NULL, "departure_offset_min" integer NOT NULL, "distance_from_origin_km" integer NOT NULL, "boarding_allowed" boolean NOT NULL DEFAULT true, "dropping_allowed" boolean NOT NULL DEFAULT true, CONSTRAINT "chk_route_stop_halt" CHECK (departure_offset_min >= arrival_offset_min), CONSTRAINT "PK_22c09afc24c0a7a13644c629073" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_route_stop_stop" ON "route_stops"  ("stop_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_route_stop_stop" ON "route_stops"  ("route_id", "stop_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_route_stop_seq" ON "route_stops"  ("route_id", "seq") `,
    );
    await queryRunner.query(
      `CREATE TABLE "trip_stops" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "trip_id" integer NOT NULL, "stop_id" integer NOT NULL, "seq" smallint NOT NULL, "arrival_at" TIMESTAMP WITH TIME ZONE, "departure_at" TIMESTAMP WITH TIME ZONE, "is_skipped" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_876633f878970267cb0dc525984" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_trip_stop_trip" ON "trip_stops"  ("trip_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_trip_stop_search" ON "trip_stops"  ("stop_id", "departure_at") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_trip_stop_seq" ON "trip_stops"  ("trip_id", "seq") `,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_64cd97487c5c42806458ab5520c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "operators" ADD CONSTRAINT "FK_18b43281dbd150094cc6ae89ad1" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" ADD CONSTRAINT "FK_a5d51574b60f8848d203e5f4241" FOREIGN KEY ("operator_id") REFERENCES "operators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "routes" ADD CONSTRAINT "FK_699c50db7c54c0ef95c806abd7f" FOREIGN KEY ("operator_id") REFERENCES "operators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "booking_legs" ADD CONSTRAINT "FK_f17483f363dfe8d444f76251b34" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_legs" ADD CONSTRAINT "FK_18f2809a3acf712ce42b562c148" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "passengers" ADD CONSTRAINT "FK_a0bb69b58ab827537151e002bd2" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seats" ADD CONSTRAINT "FK_63891430d84257508216445c058" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seat_bookings" ADD CONSTRAINT "FK_fe0a07914fc5387ed36d85fd816" FOREIGN KEY ("booking_leg_id") REFERENCES "booking_legs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seat_bookings" ADD CONSTRAINT "FK_a525db8aba0596ae1af0ab7f825" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seat_bookings" ADD CONSTRAINT "FK_9755453d6d58cfd0562703ef56c" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seat_bookings" ADD CONSTRAINT "FK_200c92aec061bf119f00546c56b" FOREIGN KEY ("passenger_id") REFERENCES "passengers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_fares" ADD CONSTRAINT "FK_fc33337eecd6415b5aeabb6f9c8" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stops" ADD CONSTRAINT "FK_6499628a51682a26ab8c6d32d5a" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stops" ADD CONSTRAINT "FK_b16cab5c66870949cbb4ee748c0" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stops" ADD CONSTRAINT "FK_3d326d5552dacba78e0aba897c3" FOREIGN KEY ("stop_id") REFERENCES "stops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trip_stops" ADD CONSTRAINT "FK_5cb5ec6432abdf6f1e1c3a0970c" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trip_stops" ADD CONSTRAINT "FK_e237b8b35bbaedd453e3bd7bbbd" FOREIGN KEY ("stop_id") REFERENCES "stops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trip_stops" DROP CONSTRAINT "FK_e237b8b35bbaedd453e3bd7bbbd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trip_stops" DROP CONSTRAINT "FK_5cb5ec6432abdf6f1e1c3a0970c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stops" DROP CONSTRAINT "FK_3d326d5552dacba78e0aba897c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stops" DROP CONSTRAINT "FK_b16cab5c66870949cbb4ee748c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stops" DROP CONSTRAINT "FK_6499628a51682a26ab8c6d32d5a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_fares" DROP CONSTRAINT "FK_fc33337eecd6415b5aeabb6f9c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seat_bookings" DROP CONSTRAINT "FK_200c92aec061bf119f00546c56b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seat_bookings" DROP CONSTRAINT "FK_9755453d6d58cfd0562703ef56c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seat_bookings" DROP CONSTRAINT "FK_a525db8aba0596ae1af0ab7f825"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seat_bookings" DROP CONSTRAINT "FK_fe0a07914fc5387ed36d85fd816"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seats" DROP CONSTRAINT "FK_63891430d84257508216445c058"`,
    );
    await queryRunner.query(
      `ALTER TABLE "passengers" DROP CONSTRAINT "FK_a0bb69b58ab827537151e002bd2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_legs" DROP CONSTRAINT "FK_18f2809a3acf712ce42b562c148"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_legs" DROP CONSTRAINT "FK_f17483f363dfe8d444f76251b34"`,
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
      `ALTER TABLE "routes" DROP CONSTRAINT "FK_699c50db7c54c0ef95c806abd7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "buses" DROP CONSTRAINT "FK_a5d51574b60f8848d203e5f4241"`,
    );
    await queryRunner.query(
      `ALTER TABLE "operators" DROP CONSTRAINT "FK_18b43281dbd150094cc6ae89ad1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_64cd97487c5c42806458ab5520c"`,
    );
    await queryRunner.query(`DROP INDEX "public"."uq_trip_stop_seq"`);
    await queryRunner.query(`DROP INDEX "public"."idx_trip_stop_search"`);
    await queryRunner.query(`DROP INDEX "public"."idx_trip_stop_trip"`);
    await queryRunner.query(`DROP TABLE "trip_stops"`);
    await queryRunner.query(`DROP INDEX "public"."uq_route_stop_seq"`);
    await queryRunner.query(`DROP INDEX "public"."uq_route_stop_stop"`);
    await queryRunner.query(`DROP INDEX "public"."idx_route_stop_stop"`);
    await queryRunner.query(`DROP TABLE "route_stops"`);
    await queryRunner.query(`DROP INDEX "public"."uq_stop_city_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_stop_city"`);
    await queryRunner.query(`DROP TABLE "stops"`);
    await queryRunner.query(`DROP INDEX "public"."uq_route_fare_segment"`);
    await queryRunner.query(`DROP TABLE "route_fares"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payment_booking"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_seat_availability"`);
    await queryRunner.query(`DROP INDEX "public"."idx_seat_booking_leg"`);
    await queryRunner.query(`DROP TABLE "seat_bookings"`);
    await queryRunner.query(`DROP TYPE "public"."seat_bookings_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_bus_seat"`);
    await queryRunner.query(`DROP TABLE "seats"`);
    await queryRunner.query(`DROP TYPE "public"."seats_deck_enum"`);
    await queryRunner.query(`DROP TYPE "public"."seats_seat_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_passenger_booking_id"`);
    await queryRunner.query(`DROP TABLE "passengers"`);
    await queryRunner.query(`DROP TYPE "public"."passengers_gender_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_leg_order"`);
    await queryRunner.query(`DROP INDEX "public"."idx_leg_trip"`);
    await queryRunner.query(`DROP TABLE "booking_legs"`);
    await queryRunner.query(`DROP TYPE "public"."booking_legs_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_bus_not_double_booked"`);
    await queryRunner.query(`DROP INDEX "public"."idx_trip_route_date"`);
    await queryRunner.query(`DROP TABLE "trips"`);
    await queryRunner.query(`DROP TYPE "public"."trips_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_route_city_pair"`);
    await queryRunner.query(`DROP INDEX "public"."idx_route_operator"`);
    await queryRunner.query(`DROP INDEX "public"."idx_route_service_group"`);
    await queryRunner.query(`DROP TABLE "routes"`);
    await queryRunner.query(`DROP TYPE "public"."routes_direction_enum"`);
    await queryRunner.query(`DROP INDEX "public"."uq_city_name_state"`);
    await queryRunner.query(`DROP TABLE "cities"`);
    await queryRunner.query(`DROP TABLE "buses"`);
    await queryRunner.query(`DROP TYPE "public"."buses_bus_type_enum"`);
    await queryRunner.query(`DROP TABLE "operators"`);
    await queryRunner.query(`DROP INDEX "public"."idx_booking_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_booking_sweeper"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
