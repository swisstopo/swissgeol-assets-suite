-- Replace line break tags (<br>) in asset titles with a space.

UPDATE asset
SET title_original = regexp_replace(title_original, '\s*<br>\s*', ' ', 'g')
WHERE title_original LIKE '%<br>%';

UPDATE asset
SET title_public = regexp_replace(title_public, '\s*<br>\s*', ' ', 'g')
WHERE title_public LIKE '%<br>%';
