
-- Create a stored procedure to safely create clubs
CREATE OR REPLACE FUNCTION public.create_club(
  club_name TEXT,
  club_description TEXT,
  club_is_public BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_club_id UUID;
BEGIN
  -- Check if the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if the user already has a club with this name
  IF EXISTS (
    SELECT 1 
    FROM public.clubs 
    WHERE name = club_name 
    AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You already have a club with this name';
  END IF;

  -- Insert the new club and return its ID
  INSERT INTO public.clubs (
    name,
    description,
    is_public,
    created_by
  ) VALUES (
    club_name,
    club_description,
    club_is_public,
    auth.uid()
  )
  RETURNING id INTO new_club_id;
  
  -- Add the creator as an admin of the club
  -- Use INSERT ON CONFLICT DO NOTHING to prevent duplicates
  INSERT INTO public.club_members (
    club_id, 
    profile_id, 
    is_admin
  ) 
  VALUES (
    new_club_id,
    auth.uid(),
    true
  )
  ON CONFLICT (club_id, profile_id) DO NOTHING;
  
  -- Return the new club ID
  RETURN new_club_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_club TO authenticated;
