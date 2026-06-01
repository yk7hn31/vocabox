alter table public.attempts
  drop constraint attempts_mcq_total_check,
  add constraint attempts_mcq_total_check check (mcq_total >= 0);

alter table public.attempt_responses
  drop constraint attempt_responses_question_type_check,
  add constraint attempt_responses_question_type_check check (question_type in ('mcq', 'multi', 'type'));
