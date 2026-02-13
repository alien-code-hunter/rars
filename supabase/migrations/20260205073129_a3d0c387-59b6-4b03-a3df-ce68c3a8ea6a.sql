-- RARS: Research Approval & Repository System - Complete Schema

-- =====================
-- ENUMS
-- =====================

-- User roles enum
CREATE TYPE public.user_role AS ENUM (
  'PUBLIC',
  'APPLICANT', 
  'ADMIN_OFFICER', 
  'REVIEWER', 
  'EXECUTIVE_DIRECTOR', 
  'SYSTEM_ADMIN'
);

-- Applicant type enum
CREATE TYPE public.applicant_type AS ENUM (
  'STUDENT', 
  'NGO', 
  'CONSULTANT', 
  'GOVERNMENT', 
  'ACADEMIC', 
  'OTHER'
);

-- Application status enum
CREATE TYPE public.application_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'SCREENING',
  'RETURNED',
  'IN_REVIEW',
  'ED_DECISION',
  'APPROVED',
  'REJECTED',
  'ACTIVE_RESEARCH',
  'FINAL_SUBMISSION_PENDING',
  'COMPLETED',
  'PUBLISHED'
);

-- Data type enum
CREATE TYPE public.data_type AS ENUM (
  'AGGREGATED',
  'PATIENT_LEVEL'
);

-- Sensitivity level enum
CREATE TYPE public.sensitivity_level AS ENUM (
  'PUBLIC',
  'RESTRICTED'
);

-- Document type enum
CREATE TYPE public.document_type AS ENUM (
  'ETHICS_LETTER',
  'SUPERVISOR_LETTER',
  'INSTITUTION_LETTER',
  'PROPOSAL',
  'FINAL_PAPER',
  'TOOL',
  'DATASET',
  'CODEBOOK',
  'APPROVAL_LETTER',
  'REJECTION_LETTER',
  'OTHER'
);

-- Review stage enum
CREATE TYPE public.review_stage AS ENUM (
  'PROGRAM',
  'HIS',
  'DATA_OWNER',
  'TECHNICAL',
  'OTHER'
);

-- Review recommendation enum
CREATE TYPE public.recommendation AS ENUM (
  'APPROVE',
  'REJECT'
);

-- Decision enum
CREATE TYPE public.decision_type AS ENUM (
  'APPROVED',
  'REJECTED'
);

-- Extension status enum
CREATE TYPE public.extension_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

-- Access log action enum
CREATE TYPE public.access_action AS ENUM (
  'VIEW',
  'DOWNLOAD'
);

-- =====================
-- TABLES
-- =====================

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  applicant_type public.applicant_type DEFAULT 'OTHER',
  institution TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate for RBAC security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT UNIQUE NOT NULL,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  abstract TEXT,
  objectives TEXT,
  methodology TEXT,
  data_type public.data_type DEFAULT 'AGGREGATED',
  sensitivity_level public.sensitivity_level DEFAULT 'PUBLIC',
  sensitivity_reason TEXT,
  regions_facilities JSONB DEFAULT '[]'::jsonb,
  start_date DATE,
  end_date DATE,
  status public.application_status DEFAULT 'DRAFT',
  ethics_approved BOOLEAN DEFAULT false,
  supervisor_name TEXT,
  supervisor_email TEXT,
  screening_deadline DATE,
  turnaround_deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index on reference_number
CREATE UNIQUE INDEX idx_applications_reference ON public.applications(reference_number);

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type public.document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  version INTEGER DEFAULT 1,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_documents_application ON public.documents(application_id, document_type, version);

-- Messages table (clarifications thread)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_application ON public.messages(application_id, created_at);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  review_stage public.review_stage NOT NULL,
  recommendation public.recommendation,
  comments TEXT,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ
);

CREATE INDEX idx_reviews_application ON public.reviews(application_id);
CREATE INDEX idx_reviews_reviewer ON public.reviews(reviewer_id);

-- Decisions table
CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  decision public.decision_type NOT NULL,
  decided_by UUID NOT NULL REFERENCES auth.users(id),
  decision_date TIMESTAMPTZ DEFAULT now(),
  letter_document_id UUID REFERENCES public.documents(id),
  notes TEXT
);

CREATE INDEX idx_decisions_application ON public.decisions(application_id);

-- Extensions table
CREATE TABLE public.extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  current_end_date DATE,
  requested_end_date DATE NOT NULL,
  status public.extension_status DEFAULT 'PENDING',
  decided_by UUID REFERENCES auth.users(id),
  decision_date TIMESTAMPTZ,
  decision_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_extensions_application ON public.extensions(application_id);

-- Repository items table
CREATE TABLE public.repository_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  public_visible BOOLEAN DEFAULT true,
  restricted BOOLEAN DEFAULT false,
  restriction_reason TEXT,
  keywords JSONB DEFAULT '[]'::jsonb,
  publication_year INTEGER,
  institution TEXT,
  program_area TEXT,
  published_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_repository_keywords ON public.repository_items USING GIN(keywords);

-- Access logs table
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_item_id UUID NOT NULL REFERENCES public.repository_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action public.access_action NOT NULL,
  ip_address INET,
  user_agent TEXT,
  terms_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_access_logs_item ON public.access_logs(repository_item_id, created_at);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  before_json JSONB,
  after_json JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id, created_at);

-- =====================
-- SECURITY DEFINER FUNCTIONS
-- =====================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Function to check if user is staff (admin officer, reviewer, ED, or sysadmin)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('ADMIN_OFFICER', 'REVIEWER', 'EXECUTIVE_DIRECTOR', 'SYSTEM_ADMIN')
  )
$$;

-- Generate reference number
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  ref_num TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq_num 
  FROM public.applications 
  WHERE reference_number LIKE 'RARS-' || year_part || '-%';
  ref_num := 'RARS-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN ref_num;
END;
$$;

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================
-- TRIGGERS
-- =====================

-- Auto-generate reference number on insert
CREATE OR REPLACE FUNCTION public.set_reference_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := public.generate_reference_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_reference_number
BEFORE INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.set_reference_number();

-- Update timestamps triggers
CREATE TRIGGER trigger_update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_applications_timestamp
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign default APPLICANT role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'APPLICANT');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Staff can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "System admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

-- USER_ROLES POLICIES
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

CREATE POLICY "System admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

-- APPLICATIONS POLICIES
CREATE POLICY "Applicants can view own applications"
ON public.applications FOR SELECT
TO authenticated
USING (applicant_id = auth.uid());

CREATE POLICY "Staff can view all applications"
ON public.applications FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Applicants can create applications"
ON public.applications FOR INSERT
TO authenticated
WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Applicants can update draft applications"
ON public.applications FOR UPDATE
TO authenticated
USING (applicant_id = auth.uid() AND status IN ('DRAFT', 'RETURNED'));

CREATE POLICY "Staff can update applications"
ON public.applications FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()));

-- DOCUMENTS POLICIES
CREATE POLICY "Applicants can view own documents"
ON public.documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a 
    WHERE a.id = application_id AND a.applicant_id = auth.uid()
  )
);

CREATE POLICY "Staff can view all documents"
ON public.documents FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Applicants can upload documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.applications a 
    WHERE a.id = application_id AND a.applicant_id = auth.uid()
  )
);

-- MESSAGES POLICIES
CREATE POLICY "Applicants can view messages on own applications"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a 
    WHERE a.id = application_id AND a.applicant_id = auth.uid()
  )
);

CREATE POLICY "Staff can view all messages"
ON public.messages FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Authenticated users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  (
    EXISTS (
      SELECT 1 FROM public.applications a 
      WHERE a.id = application_id AND a.applicant_id = auth.uid()
    )
    OR public.is_staff(auth.uid())
  )
);

-- REVIEWS POLICIES
CREATE POLICY "Reviewers can view assigned reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (reviewer_id = auth.uid());

CREATE POLICY "Staff can view all reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admin officers can assign reviewers"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'ADMIN_OFFICER') OR 
  public.has_role(auth.uid(), 'SYSTEM_ADMIN')
);

CREATE POLICY "Reviewers can submit their reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (reviewer_id = auth.uid());

-- DECISIONS POLICIES
CREATE POLICY "ED and staff can view decisions"
ON public.decisions FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Applicants can view decisions on own applications"
ON public.decisions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a 
    WHERE a.id = application_id AND a.applicant_id = auth.uid()
  )
);

CREATE POLICY "ED can create decisions"
ON public.decisions FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'EXECUTIVE_DIRECTOR') OR 
  public.has_role(auth.uid(), 'SYSTEM_ADMIN')
);

-- EXTENSIONS POLICIES
CREATE POLICY "Applicants can view own extensions"
ON public.extensions FOR SELECT
TO authenticated
USING (requested_by = auth.uid());

CREATE POLICY "Staff can view all extensions"
ON public.extensions FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Applicants can request extensions"
ON public.extensions FOR INSERT
TO authenticated
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admin officers can decide on extensions"
ON public.extensions FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'ADMIN_OFFICER') OR 
  public.has_role(auth.uid(), 'SYSTEM_ADMIN')
);

-- REPOSITORY_ITEMS POLICIES (Public readable)
CREATE POLICY "Anyone can view public repository items"
ON public.repository_items FOR SELECT
TO anon, authenticated
USING (public_visible = true);

CREATE POLICY "Staff can manage repository items"
ON public.repository_items FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));

-- ACCESS_LOGS POLICIES
CREATE POLICY "Anyone can create access logs"
ON public.access_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Staff can view access logs"
ON public.access_logs FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- AUDIT_LOGS POLICIES
CREATE POLICY "System admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'SYSTEM_ADMIN'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================
-- STORAGE BUCKET
-- =====================

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'research-documents', 
  'research-documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
);

-- Storage policies
CREATE POLICY "Applicants can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'research-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'research-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Staff can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'research-documents' AND
  public.is_staff(auth.uid())
);