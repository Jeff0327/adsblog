import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiGeneratedContent } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateBlogPost(
  topic: string,
  category: string,
  keywords: string[]
): Promise<GeminiGeneratedContent> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
You are a professional blog writer. Write a comprehensive, engaging blog post in Korean about "${topic}" for the "${category}" category.

Requirements:
1. Create an SEO-optimized title (max 60 characters)
2. Write a compelling excerpt/summary (max 160 characters)
3. Write the main content (approximately 800-1200 Korean characters) in HTML format with proper headings, paragraphs, lists, and formatting
4. Include SEO title (can be different from main title, optimized for search)
5. Create an SEO description (max 160 characters)
6. Suggest 5-7 SEO keywords based on: ${keywords.join(', ')}
7. Suggest 3-5 image search keywords for Unsplash API

Output format (JSON):
{
  "title": "Main title here",
  "content": "<h2>Section 1</h2><p>Content here...</p>",
  "excerpt": "Brief summary here",
  "seo_title": "SEO optimized title",
  "seo_description": "SEO description here",
  "seo_keywords": ["keyword1", "keyword2", ...],
  "image_keywords": ["keyword1", "keyword2", "keyword3"]
}

Important:
- Content must be in Korean
- Keep content length around 1000 Korean characters (not too short, not too long)
- Use proper HTML tags for content (h2, h3, p, ul, ol, li, strong, em, etc.)
- Make it informative, engaging, and well-structured with 2-3 main sections
- Include practical examples and actionable insights
- Focus on quality over quantity
  `.trim()

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // JSON 추출 (```json ... ``` 형식일 수 있음)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from Gemini response')
    }

    const jsonText = jsonMatch[1] || jsonMatch[0]
    const parsedData = JSON.parse(jsonText)

    return parsedData as GeminiGeneratedContent
  } catch (error) {
    console.error('Error generating blog post with Gemini:', error)
    throw error
  }
}
