
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
  
  -- Return the new club ID
  RETURN new_club_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_club TO authenticated;
