create table "public"."student_grades" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "student_name" text not null,
    "subject" text not null,
    "grade" bigint not null
);


CREATE INDEX student_grades_grade_idx ON public.student_grades USING btree (grade);

CREATE UNIQUE INDEX student_grades_pkey ON public.student_grades USING btree (id);

CREATE INDEX student_grades_student_name_idx ON public.student_grades USING btree (student_name);

alter table "public"."student_grades" add constraint "student_grades_pkey" PRIMARY KEY using index "student_grades_pkey";

grant delete on table "public"."student_grades" to "anon";

grant insert on table "public"."student_grades" to "anon";

grant references on table "public"."student_grades" to "anon";

grant select on table "public"."student_grades" to "anon";

grant trigger on table "public"."student_grades" to "anon";

grant truncate on table "public"."student_grades" to "anon";

grant update on table "public"."student_grades" to "anon";

grant delete on table "public"."student_grades" to "authenticated";

grant insert on table "public"."student_grades" to "authenticated";

grant references on table "public"."student_grades" to "authenticated";

grant select on table "public"."student_grades" to "authenticated";

grant trigger on table "public"."student_grades" to "authenticated";

grant truncate on table "public"."student_grades" to "authenticated";

grant update on table "public"."student_grades" to "authenticated";

grant delete on table "public"."student_grades" to "service_role";

grant insert on table "public"."student_grades" to "service_role";

grant references on table "public"."student_grades" to "service_role";

grant select on table "public"."student_grades" to "service_role";

grant trigger on table "public"."student_grades" to "service_role";

grant truncate on table "public"."student_grades" to "service_role";

grant update on table "public"."student_grades" to "service_role";


