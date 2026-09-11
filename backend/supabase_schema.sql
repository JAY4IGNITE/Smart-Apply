-- ====================================================================
-- SKILLHUB DUAL COMPATIBILITY SUPABASE POSTGRESQL SCHEMA
-- Full Row Level Security (RLS) & Relational Tables
-- ====================================================================

-- 1. Career Paths
CREATE TABLE IF NOT EXISTS public.career_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Software Engineering',
    description TEXT,
    average_salary TEXT DEFAULT '$120,000',
    growth_rate TEXT DEFAULT '+25% (High Demand)',
    required_skills JSONB DEFAULT '[]'::jsonb,
    recommended_projects JSONB DEFAULT '[]'::jsonb,
    interview_topics JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Master Skills Taxonomy
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'Core CS',
    description TEXT,
    typical_roles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Student Skills (with RLS)
CREATE TABLE IF NOT EXISTS public.student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    skill_name TEXT NOT NULL,
    proficiency INT DEFAULT 50 CHECK (proficiency >= 0 AND proficiency <= 100),
    evidence_source TEXT DEFAULT 'manual',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, skill_name)
);
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own skills" ON public.student_skills
    FOR ALL USING (auth.uid() = user_id);

-- 4. Skill Assessment Records (with RLS)
CREATE TABLE IF NOT EXISTS public.skill_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    target_career TEXT NOT NULL,
    overall_score INT NOT NULL,
    skills_breakdown JSONB DEFAULT '{}'::jsonb,
    skill_gaps JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their assessments" ON public.skill_assessments
    FOR ALL USING (auth.uid() = user_id);

-- 5. Personalized Roadmaps (with RLS)
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    target_career TEXT NOT NULL,
    title TEXT NOT NULL,
    milestones JSONB DEFAULT '[]'::jsonb,
    completed_tasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update their own roadmaps" ON public.roadmaps
    FOR ALL USING (auth.uid() = user_id);

-- 6. Student Projects (with RLS)
CREATE TABLE IF NOT EXISTS public.student_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    technologies JSONB DEFAULT '[]'::jsonb,
    github_url TEXT,
    live_url TEXT,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their portfolio projects" ON public.student_projects
    FOR ALL USING (auth.uid() = user_id);

-- 7. Certifications (with RLS)
CREATE TABLE IF NOT EXISTS public.certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issue_date TEXT,
    credential_url TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their certifications" ON public.certifications
    FOR ALL USING (auth.uid() = user_id);

-- 8. Career Readiness Scores (with RLS)
CREATE TABLE IF NOT EXISTS public.career_readiness_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    target_career TEXT NOT NULL,
    overall_score INT NOT NULL,
    components JSONB DEFAULT '{}'::jsonb,
    breakdown_text TEXT,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.career_readiness_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their readiness scores" ON public.career_readiness_scores
    FOR ALL USING (auth.uid() = user_id);
