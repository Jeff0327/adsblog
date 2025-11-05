import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiGeneratedContent } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface MarketingContext {
  businessName?: string | null
  businessType?: string | null
  marketingGoal?: string | null
  contentStyle?: string | null
}

export async function generateBlogPost(
  topic: string,
  category: string,
  keywords: string[],
  marketingContext?: MarketingContext
): Promise<GeminiGeneratedContent> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  // 마케팅 컨텍스트 구성
  const marketingInfo = marketingContext?.businessName
    ? `
## Marketing Context
- Business: ${marketingContext.businessName}${marketingContext.businessType ? ` (${marketingContext.businessType})` : ''}
- Marketing Goal: ${marketingContext.marketingGoal || '브랜드 인지도 향상 및 고객 유치'}
- Content Style: ${marketingContext.contentStyle || '전문적이고 신뢰감 있는 톤'}

⚠️ IMPORTANT Marketing Guidelines:
1. Title must hook readers with one of these techniques:
   - Use numbers (예: "이 3가지만 알면...", "5분만에 해결하는...")
   - Emphasize benefits/merits (예: "비용 절감하는...", "효과 2배 높이는...")
   - Show differentiation (예: "다른 곳과 다른 우리만의...", "차별화된...")
   - Present problem-solving (예: "○○ 고민 해결...", "부작용 없이...")

2. Content must naturally mention "${marketingContext.businessName}" in a helpful, non-promotional way
3. Focus on providing genuine value while subtly highlighting why readers should consider "${marketingContext.businessName}"
4. DO NOT make it sound like an advertisement - maintain editorial integrity
5. Weave in the business naturally when discussing solutions or examples
`
    : ''

  const prompt = `
You are a professional blog writer. Write a comprehensive, engaging blog post in Korean about "${topic}" for the "${category}" category.
${marketingInfo}
Requirements:
1. Create an SEO-optimized, attention-grabbing title (max 60 characters) - MUST use hooking techniques above
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
