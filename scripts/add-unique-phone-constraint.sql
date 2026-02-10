-- Add UNIQUE constraint to phone column in profiles table
-- This prevents duplicate phone numbers from being registered

-- Step 1: Set empty strings to NULL (PostgreSQL UNIQUE allows multiple NULLs)
UPDATE public.profiles
SET phone = NULL
WHERE phone = '' OR phone = 'null' OR TRIM(phone) = '';

-- Step 2: Clean up any existing duplicate phone numbers (excluding NULLs)
-- Keep the oldest record for each phone number and delete newer duplicates
WITH duplicates AS (
  SELECT 
    id,
    phone,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as rn
  FROM public.profiles
  WHERE phone IS NOT NULL
)
DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 3: Add UNIQUE constraint (allows multiple NULLs but not duplicate values)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- Verify the constraint was added
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'profiles'
    AND tc.constraint_type = 'UNIQUE'
    AND kcu.column_name = 'phone';
