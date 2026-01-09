-- Add new profile fields: date_of_birth, phone_number, gender, bio
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN profiles.phone_number IS 'User phone number';
COMMENT ON COLUMN profiles.gender IS 'User gender: male, female, other';
COMMENT ON COLUMN profiles.bio IS 'User biography/introduction';
