
-- SQL to create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, '{image/*}')
ON CONFLICT (id) DO NOTHING;

-- Set liberal public policies for the avatars bucket
INSERT INTO storage.policies (name, bucket_id, permission, definition)
VALUES
('Avatar Read Policy', 'avatars', 'SELECT', '{"statement":"SELECT *","conditions":true}'),
('Avatar Insert Policy', 'avatars', 'INSERT', '{"statement":"INSERT *","conditions":true}'),
('Avatar Update Policy', 'avatars', 'UPDATE', '{"statement":"UPDATE *","conditions":true}'),
('Avatar Delete Policy', 'avatars', 'DELETE', '{"statement":"DELETE *","conditions":true}')
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Add avatar_url column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;
