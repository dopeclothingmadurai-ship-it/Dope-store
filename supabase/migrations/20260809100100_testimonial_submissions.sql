-- =============================================================================
-- Storefront · Migration — Customer testimonial submissions + approval
-- -----------------------------------------------------------------------------
-- Additive/extension. Lets signed-in customers submit their own testimonial and
-- introduces a moderation workflow. The status model moves from
-- ('published','hidden') to ('pending','approved','rejected'):
--   pending   — submitted by a customer, awaiting review (never shown publicly)
--   approved  — visible on the storefront
--   rejected  — hidden (declined, or an admin unpublished it)
-- Existing rows are migrated: published -> approved, hidden -> rejected.
-- =============================================================================

alter table public.testimonials
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists submitted_by_customer boolean not null default false,
  -- Marks seeded preview content so staff can identify and replace it with real
  -- customer testimonials before production.
  add column if not exists is_sample boolean not null default false;

-- --- Status model migration --------------------------------------------------
alter table public.testimonials drop constraint if exists testimonials_status_valid;

update public.testimonials set status = 'approved' where status = 'published';
update public.testimonials set status = 'rejected' where status = 'hidden';

alter table public.testimonials alter column status set default 'pending';
alter table public.testimonials
  add constraint testimonials_status_valid
  check (status in ('pending', 'approved', 'rejected'));

-- Display index now keys off 'approved'.
drop index if exists public.testimonials_display_idx;
create index if not exists testimonials_display_idx
  on public.testimonials (position asc, created_at desc)
  where status = 'approved';

-- Index submissions awaiting moderation (admin queue).
create index if not exists testimonials_pending_idx
  on public.testimonials (created_at desc)
  where status = 'pending';

-- --- RLS ---------------------------------------------------------------------
-- Public reads only approved testimonials (replaces the published policy).
drop policy if exists testimonials_select_published on public.testimonials;
drop policy if exists testimonials_select_approved on public.testimonials;
create policy testimonials_select_approved
  on public.testimonials for select
  to anon, authenticated
  using (status = 'approved');

-- A signed-in customer may submit their own testimonial. It is forced to the
-- pending state and tagged as a customer submission — they cannot self-approve.
drop policy if exists testimonials_insert_customer on public.testimonials;
create policy testimonials_insert_customer
  on public.testimonials for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and submitted_by_customer = true
  );

-- Customers may read the status of their own submission (pending/approved/rejected).
drop policy if exists testimonials_select_own on public.testimonials;
create policy testimonials_select_own
  on public.testimonials for select
  to authenticated
  using (user_id = auth.uid());

-- --- Demo / sample content (client preview) ----------------------------------
-- Seed a few approved sample testimonials ONLY if none exist yet, so the
-- homepage section is never empty for the preview. They are flagged
-- `is_sample = true` and shown with a "Sample" badge in the admin so staff can
-- delete them once real customer testimonials are approved.
insert into public.testimonials
  (customer_name, review, rating, location, verified_purchase, featured, status, position, is_sample)
select * from (values
  ('Aarav Menon',
   'The cut, the weight of the fabric, the finish — everything feels considered. This is the first label in Madurai that actually feels like a brand, not just a store.',
   5, 'Madurai, TN', true, true, 'approved', 0, true),
  ('Diya Krishnan',
   'Wore my piece to a shoot and got asked about it all day. Quietly bold — exactly the energy I want. The pickup experience at the store was seamless too.',
   5, 'Chennai, TN', true, false, 'approved', 1, true),
  ('Rahul Verma',
   'Premium without shouting about it. The details are where it wins — the stitching, the drape, the way it holds shape after wear. Genuinely impressed.',
   5, 'Bengaluru, KA', true, false, 'approved', 2, true)
) as seed(customer_name, review, rating, location, verified_purchase, featured, status, position, is_sample)
where not exists (
  select 1 from public.testimonials where status = 'approved'
);
