-- ============================================
-- Category Table Enhancement Migration
-- ============================================
-- This migration adds marketing and branding fields to the categories table
-- as specified in BLOG_PROJECT_GUIDE.md
--
-- Run this migration in your Supabase SQL Editor to add the new fields.
-- These fields are optional and will not break existing functionality.

-- Add industry field for categorizing the business vertical
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS industry TEXT;

-- Add brand_info JSONB field for storing branding information
-- Structure: {
--   brandName: string
--   coreValues: string[]
--   targetAudience: string
--   uniqueSellingPoints: string[]
--   brandVoice: string (professional, casual, friendly, authoritative, inspirational)
-- }
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS brand_info JSONB;

-- Add prompt_settings JSONB field for AI content generation configuration
-- Structure: {
--   contentPrompt: string    // Custom prompt for content generation
--   seoPrompt: string        // Custom prompt for SEO optimization
--   model: string            // AI model to use (e.g., "gemini-2.0-flash-exp")
--   temperature: number      // AI temperature (0-2)
--   maxTokens: number        // Maximum tokens to generate (100-8000)
-- }
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS prompt_settings JSONB;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_industry
ON categories(industry)
WHERE industry IS NOT NULL;

-- Add a comment to document the new fields
COMMENT ON COLUMN categories.industry IS 'Industry vertical: technology, fashion, food, travel, health, finance, education, etc.';
COMMENT ON COLUMN categories.brand_info IS 'JSONB field containing brand identity information';
COMMENT ON COLUMN categories.prompt_settings IS 'JSONB field containing AI content generation settings';

-- Example data insert (commented out - modify as needed)
-- UPDATE categories
-- SET
--   industry = 'technology',
--   brand_info = '{
--     "brandName": "TechBlog",
--     "coreValues": ["Innovation", "Quality", "Transparency"],
--     "targetAudience": "Software developers and tech enthusiasts",
--     "uniqueSellingPoints": ["In-depth tutorials", "Real-world examples", "Expert insights"],
--     "brandVoice": "professional"
--   }'::jsonb,
--   prompt_settings = '{
--     "contentPrompt": "Write a detailed technical article about {topic} that provides practical value to software developers. Include code examples and best practices.",
--     "seoPrompt": "Optimize for keywords related to software development and programming",
--     "model": "gemini-2.0-flash-exp",
--     "temperature": 0.7,
--     "maxTokens": 2000
--   }'::jsonb
-- WHERE slug = 'technology';

-- Verify the migration
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
AND column_name IN ('industry', 'brand_info', 'prompt_settings');
