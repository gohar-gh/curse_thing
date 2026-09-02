-- Cosmetic seeded offset so the public registry doesn't look empty on day
-- one (spec §3). This is NOT fake data — no rows are inserted — it only
-- moves the id sequence forward so the first real certificate is No. 04000
-- instead of No. 00001.
ALTER SEQUENCE certificates_id_seq RESTART WITH 4000;
