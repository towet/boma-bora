-- Drop the existing trigger and function first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create or replace the function to handle new user creation with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE 
    role_val text;
BEGIN
    -- Extract and validate role
    role_val := NEW.raw_user_meta_data->>'role';
    
    -- Insert with explicit type casting and NULL checks
    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        location
    )
    VALUES (
        NEW.id,
        COALESCE(role_val, 'farmer')::user_role, -- Default to 'farmer' if role is null
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''), -- Default to empty string if null
        COALESCE(NEW.raw_user_meta_data->>'location', '') -- Default to empty string if null
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error (will appear in Supabase logs)
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
    -- Re-raise the error
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
