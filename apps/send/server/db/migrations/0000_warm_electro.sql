CREATE SCHEMA IF NOT EXISTS "send";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."study_status" AS ENUM('draft', 'in_progress', 'completed', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"subject_id" uuid,
	"related_domain" varchar(2),
	"seq" integer NOT NULL,
	"id_var" varchar(50),
	"id_var_value" varchar(200),
	"comment_value" text NOT NULL,
	"comment_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."dispositions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"category" varchar(200),
	"term" varchar(200) NOT NULL,
	"decoded_term" varchar(200),
	"visit_day" integer,
	"start_date" timestamp with time zone,
	"start_day" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."exposures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"treatment" varchar(200) NOT NULL,
	"dose" double precision,
	"dose_unit" varchar(50),
	"dose_form" varchar(100),
	"dose_frequency" varchar(50),
	"route" varchar(100),
	"lot_number" varchar(100),
	"vehicle" varchar(100),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"start_day" integer,
	"end_day" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"subject_id" uuid,
	"domain" varchar(2) NOT NULL,
	"seq" integer NOT NULL,
	"test_code" varchar(50) NOT NULL,
	"test_name" varchar(200) NOT NULL,
	"category" varchar(200),
	"subcategory" varchar(200),
	"original_result" text,
	"original_unit" varchar(50),
	"standard_result" varchar(200),
	"standard_result_numeric" double precision,
	"standard_unit" varchar(50),
	"result_category" varchar(100),
	"finding_status" varchar(20),
	"reason_not_done" varchar(200),
	"specimen" varchar(100),
	"anatomical_region" varchar(100),
	"laterality" varchar(20),
	"severity" varchar(50),
	"method" varchar(100),
	"baseline_flag" varchar(1),
	"location" varchar(100),
	"death_relation" varchar(50),
	"visit_day" integer,
	"date_collected" timestamp with time zone,
	"end_date" timestamp with time zone,
	"study_day" integer,
	"end_day" integer,
	"domain_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."related_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"subject_id" uuid,
	"related_domain" varchar(2) NOT NULL,
	"id_var" varchar(50),
	"id_var_value" varchar(200),
	"relation_type" varchar(50),
	"relation_id" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"status" "study_status" DEFAULT 'draft' NOT NULL,
	"sponsor" varchar(200),
	"study_director" varchar(200),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"species" varchar(100),
	"strain" varchar(100),
	"route" varchar(100),
	"test_article" varchar(200),
	"glp_status" varchar(50),
	"send_version" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "studies_study_id_unique" UNIQUE("study_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."subject_elements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"etcd" varchar(20),
	"element" varchar(200),
	"sestdtc" timestamp with time zone,
	"seendtc" timestamp with time zone,
	"epoch" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"usubjid" varchar(100) NOT NULL,
	"subjid" varchar(50) NOT NULL,
	"sex" varchar(10) NOT NULL,
	"species" varchar(100),
	"strain" varchar(100),
	"sbstrain" varchar(100),
	"arm_code" varchar(20),
	"arm" varchar(200),
	"set_code" varchar(20),
	"rfstdtc" timestamp with time zone,
	"rfendtc" timestamp with time zone,
	"rficdtc" timestamp with time zone,
	"dthdtc" timestamp with time zone,
	"dthfl" varchar(1),
	"siteid" varchar(50),
	"brthdtc" timestamp with time zone,
	"agetxt" varchar(20),
	"ageu" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "uq_subjects_study_usubjid" UNIQUE("study_id","usubjid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."supplemental_qualifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"subject_id" uuid,
	"related_domain" varchar(2) NOT NULL,
	"id_var" varchar(50),
	"id_var_value" varchar(200),
	"qualifier_name" varchar(50) NOT NULL,
	"qualifier_label" varchar(200),
	"qualifier_value" text NOT NULL,
	"origin" varchar(50),
	"evaluator" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."trial_arms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"arm_code" varchar(20) NOT NULL,
	"arm" varchar(200) NOT NULL,
	"taetord" integer,
	"etcd" varchar(20),
	"element" varchar(200),
	"tabranch" varchar(200),
	"epoch" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "uq_trial_arms_study_arm" UNIQUE("study_id","arm_code","taetord")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."trial_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"set_code" varchar(20) NOT NULL,
	"set_description" varchar(200) NOT NULL,
	"seq" integer,
	"parameter_code" varchar(20),
	"parameter" varchar(200),
	"value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "uq_trial_sets_study_set_seq" UNIQUE("study_id","set_code","seq")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send"."trial_summary_parameters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"group_id" varchar(50),
	"parameter_code" varchar(20) NOT NULL,
	"parameter" varchar(200) NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."comments" ADD CONSTRAINT "comments_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."comments" ADD CONSTRAINT "comments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "send"."subjects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."dispositions" ADD CONSTRAINT "dispositions_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."dispositions" ADD CONSTRAINT "dispositions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "send"."subjects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."exposures" ADD CONSTRAINT "exposures_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."exposures" ADD CONSTRAINT "exposures_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "send"."subjects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."findings" ADD CONSTRAINT "findings_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."findings" ADD CONSTRAINT "findings_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "send"."subjects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."related_records" ADD CONSTRAINT "related_records_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."related_records" ADD CONSTRAINT "related_records_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "send"."subjects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."subject_elements" ADD CONSTRAINT "subject_elements_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."subject_elements" ADD CONSTRAINT "subject_elements_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "send"."subjects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."subjects" ADD CONSTRAINT "subjects_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."supplemental_qualifiers" ADD CONSTRAINT "supplemental_qualifiers_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."supplemental_qualifiers" ADD CONSTRAINT "supplemental_qualifiers_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "send"."subjects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."trial_arms" ADD CONSTRAINT "trial_arms_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."trial_sets" ADD CONSTRAINT "trial_sets_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."trial_summary_parameters" ADD CONSTRAINT "trial_summary_parameters_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_findings_study_domain" ON "send"."findings" USING btree ("study_id","domain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_findings_subject" ON "send"."findings" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_findings_domain_test" ON "send"."findings" USING btree ("domain","test_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_findings_study_subject_domain" ON "send"."findings" USING btree ("study_id","subject_id","domain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subjects_study_id" ON "send"."subjects" USING btree ("study_id");