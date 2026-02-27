
-- Add status column to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Create account_actions table for logging block/investigate actions
CREATE TABLE public.account_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  admin_id uuid NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on account_actions
ALTER TABLE public.account_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for account_actions
CREATE POLICY "Authenticated users can read account_actions"
ON public.account_actions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert account_actions"
ON public.account_actions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = admin_id);

-- Create user_preferences table for theme storage
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  theme text NOT NULL DEFAULT 'system',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
ON public.user_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
