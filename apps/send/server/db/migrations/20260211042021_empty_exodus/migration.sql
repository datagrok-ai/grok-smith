ALTER TABLE "send"."comments" DROP CONSTRAINT "comments_study_id_studies_id_fk";
--> statement-breakpoint
ALTER TABLE "send"."dispositions" DROP CONSTRAINT "dispositions_study_id_studies_id_fk";
--> statement-breakpoint
ALTER TABLE "send"."exposures" DROP CONSTRAINT "exposures_study_id_studies_id_fk";
--> statement-breakpoint
ALTER TABLE "send"."findings" DROP CONSTRAINT "findings_study_id_studies_id_fk";
--> statement-breakpoint
ALTER TABLE "send"."related_records" DROP CONSTRAINT "related_records_study_id_studies_id_fk";
--> statement-breakpoint
ALTER TABLE "send"."subject_elements" DROP CONSTRAINT "subject_elements_study_id_studies_id_fk";
--> statement-breakpoint
ALTER TABLE "send"."subjects" DROP CONSTRAINT "subjects_study_id_studies_id_fk";
--> statement-breakpoint
ALTER TABLE "send"."supplemental_qualifiers" DROP CONSTRAINT "supplemental_qualifiers_study_id_studies_id_fk";
--> statement-breakpoint
ALTER TABLE "send"."trial_arms" DROP CONSTRAINT "trial_arms_study_id_studies_id_fk";
--> statement-breakpoint
ALTER TABLE "send"."trial_sets" DROP CONSTRAINT "trial_sets_study_id_studies_id_fk";
--> statement-breakpoint
ALTER TABLE "send"."trial_summary_parameters" DROP CONSTRAINT "trial_summary_parameters_study_id_studies_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."comments" ADD CONSTRAINT "comments_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."dispositions" ADD CONSTRAINT "dispositions_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."exposures" ADD CONSTRAINT "exposures_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."findings" ADD CONSTRAINT "findings_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."related_records" ADD CONSTRAINT "related_records_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."subject_elements" ADD CONSTRAINT "subject_elements_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."subjects" ADD CONSTRAINT "subjects_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."supplemental_qualifiers" ADD CONSTRAINT "supplemental_qualifiers_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."trial_arms" ADD CONSTRAINT "trial_arms_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."trial_sets" ADD CONSTRAINT "trial_sets_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "send"."trial_summary_parameters" ADD CONSTRAINT "trial_summary_parameters_study_id_studies_id_fk" FOREIGN KEY ("study_id") REFERENCES "send"."studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
