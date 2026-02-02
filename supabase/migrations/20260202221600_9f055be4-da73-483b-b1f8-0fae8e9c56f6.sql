-- Force RLS on both tables to ensure policies apply even to table owners
ALTER TABLE public.patients FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;

-- Fix patients table: Drop RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can view their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can create their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can update their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete their own patients" ON public.patients;

CREATE POLICY "Users can view their own patients"
ON public.patients FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own patients"
ON public.patients FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients"
ON public.patients FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients"
ON public.patients FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Fix user_roles table: Drop RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can delete roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'owner'));