import { GeminiGeneratedContent } from '@/types'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

interface MarketingContext {
  businessName?: string | null
  businessDescription?: string | null
  promotionGoal?: string | null
  contentStyle?: string | null
  industry?: string | null
  brandInfo?: {
    brandName?: string
    coreValues?: string[]
    targetAudience?: string
    uniqueSellingPoints?: string[]
    brandVoice?: string
  } | null
  promptSettings?: {
    provider?: 'openai' | 'gemini' | 'claude'
    apiKey?: string
    model?: string
    contentPrompt?: string
    seoPrompt?: string
    temperature?: number
    maxTokens?: number
  } | null
}

/**
 * 프롬프트 생성 (모든 AI 제공자 공통)
 */
function createPrompt(
  topic: string,
  keywords: string[],
  marketingContext?: MarketingContext
): string {
  // 마케팅 컨텍스트 구성
  const marketingInfo = marketingContext?.businessName
    ? `
## 마케팅 정보
- 비즈니스: ${marketingContext.businessName}${marketingContext.industry ? ` (${marketingContext.industry} 산업)` : ''}
${marketingContext.businessDescription ? `- 설명: ${marketingContext.businessDescription}` : ''}
- 마케팅 목표: ${marketingContext.promotionGoal || '브랜드 인지도 향상 및 고객 유치'}
- 콘텐츠 스타일: ${marketingContext.contentStyle || '전문적이고 신뢰감 있는 톤'}
${marketingContext.brandInfo?.targetAudience ? `- 타겟 고객: ${marketingContext.brandInfo.targetAudience}` : ''}
${marketingContext.brandInfo?.brandVoice ? `- 브랜드 톤앤매너: ${marketingContext.brandInfo.brandVoice}` : ''}
${marketingContext.brandInfo?.uniqueSellingPoints?.length ? `- 차별점: ${marketingContext.brandInfo.uniqueSellingPoints.join(', ')}` : ''}

⚠️ 중요한 마케팅 가이드라인:
1. 제목은 다음 기법 중 하나를 사용하여 독자를 끌어당겨야 합니다:
   - 숫자 사용 (예: "이 3가지만 알면...", "5분만에 해결하는...")
   - 이점/장점 강조 (예: "비용 절감하는...", "효과 2배 높이는...")
   - 차별화 표현 (예: "다른 곳과 다른 우리만의...", "차별화된...")
   - 문제 해결 제시 (예: "○○ 고민 해결...", "부작용 없이...")

2. 콘텐츠에 "${marketingContext.businessName}"을 자연스럽고 도움이 되는 방식으로 언급해야 합니다
3. 광고처럼 들리지 않도록 편집적 진실성을 유지하면서 진정한 가치를 제공하세요
4. 솔루션이나 예시를 논의할 때 비즈니스를 자연스럽게 녹여내세요
`
    : ''

  // 커스텀 프롬프트 (promptSettings에서)
  const customPrompt = marketingContext?.promptSettings?.contentPrompt || ''

  return `
당신은 전문 블로그 작가입니다. 한국어로 "${topic}"에 대한 포괄적이고 매력적인 블로그 포스트를 작성하세요.

${marketingInfo}

요구사항:
1. SEO 최적화된 주목을 끄는 제목 작성 (최대 60자) - 위의 후킹 기법 필수 사용
2. 매력적인 요약/발췌문 작성 (최대 160자)
3. HTML 형식의 본문 작성 (약 800-1200자)
   - 적절한 heading, paragraph, list, 포맷 사용
4. 태그 3-5개 생성 (콘텐츠 분류용, 한글)
5. SEO 제목 작성 (메인 제목과 다를 수 있음, 검색 최적화)
6. SEO 설명 작성 (최대 160자)
7. 키워드 기반 SEO 키워드 5-7개 제안: ${keywords.join(', ')}
8. Unsplash API용 이미지 검색 키워드 3-5개 제안 (영문)

${customPrompt}

출력 형식 (JSON):
{
  "title": "메인 제목",
  "content": "<h2>섹션 1</h2><p>내용...</p>",
  "excerpt": "간단한 요약",
  "tags": ["태그1", "태그2", "태그3"],
  "seo_title": "SEO 최적화 제목",
  "seo_description": "SEO 설명",
  "seo_keywords": ["키워드1", "키워드2", ...],
  "image_keywords": ["keyword1", "keyword2", "keyword3"]
}

중요사항:
- 모든 콘텐츠는 한국어로 작성 (image_keywords만 영문)
- 콘텐츠 길이는 약 1000자 내외 (너무 짧거나 길지 않게)
- 콘텐츠에 적절한 HTML 태그 사용 (h2, h3, p, ul, ol, li, strong, em 등)
- 2-3개의 주요 섹션으로 정보성 있고 매력적이며 잘 구조화된 글 작성
- 실용적인 예시와 실행 가능한 인사이트 포함
- 양보다 질 우선
  `.trim()
}

/**
 * JSON 응답 파싱 (공통)
 */
function parseJsonResponse(text: string): GeminiGeneratedContent {
  // JSON 추출 (```json ... ``` 형식일 수 있음)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from AI response')
  }

  const jsonText = jsonMatch[1] || jsonMatch[0]
  const parsedData = JSON.parse(jsonText)

  // tags가 없으면 기본값 설정
  if (!parsedData.tags || parsedData.tags.length === 0) {
    parsedData.tags = ['일반']
  }

  return parsedData as GeminiGeneratedContent
}

/**
 * OpenAI (ChatGPT) 호출
 */
async function generateWithOpenAI(
  apiKey: string,
  model: string,
  prompt: string,
  temperature?: number,
  maxTokens?: number
): Promise<GeminiGeneratedContent> {
  const openai = new OpenAI({ apiKey })

  const completion = await openai.chat.completions.create({
    model: model || 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: temperature ?? 0.7,
    max_tokens: maxTokens ?? 2000,
  })

  const text = completion.choices[0]?.message?.content || ''
  return parseJsonResponse(text)
}

/**
 * Google Gemini 호출
 */
async function generateWithGemini(
  apiKey: string,
  model: string,
  prompt: string,
  temperature?: number
): Promise<GeminiGeneratedContent> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-2.5-flash' })

  const result = await geminiModel.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  return parseJsonResponse(text)
}

/**
 * Anthropic Claude 호출
 */
async function generateWithClaude(
  apiKey: string,
  model: string,
  prompt: string,
  temperature?: number,
  maxTokens?: number
): Promise<GeminiGeneratedContent> {
  const anthropic = new Anthropic({ apiKey })

  const message = await anthropic.messages.create({
    model: model || 'claude-3-5-sonnet-20241022',
    max_tokens: maxTokens ?? 2000,
    temperature: temperature ?? 0.7,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
  return parseJsonResponse(text)
}

/**
 * 블로그 포스트 생성 (범용 함수)
 */
export async function generateBlogPost(
  topic: string,
  keywords: string[],
  marketingContext?: MarketingContext
): Promise<GeminiGeneratedContent> {
  try {
    const provider = marketingContext?.promptSettings?.provider || 'gemini'
    const temperature = marketingContext?.promptSettings?.temperature
    const maxTokens = marketingContext?.promptSettings?.maxTokens

    // API key: promptSettings에서 우선 가져오고, 없으면 환경 변수에서 가져오기
    let apiKey = marketingContext?.promptSettings?.apiKey
    let model = marketingContext?.promptSettings?.model || ''

    if (!apiKey) {
      // 환경 변수에서 기본 API key 가져오기
      switch (provider) {
        case 'openai':
          apiKey = process.env.OPENAI_API_KEY
          model = model || 'gpt-4o'
          break
        case 'gemini':
          apiKey = process.env.GEMINI_API_KEY
          model = model || 'gemini-2.0-flash-exp'
          break
        case 'claude':
          apiKey = process.env.ANTHROPIC_API_KEY
          model = model || 'claude-3-5-sonnet-20241022'
          break
        default:
          throw new Error(`Unsupported AI provider: ${provider}`)
      }
    }

    if (!apiKey) {
      throw new Error(`API key not found for provider: ${provider}. Please set in blog settings or environment variables.`)
    }

    const prompt = createPrompt(topic, keywords, marketingContext)

    console.log(`[AI] Using provider: ${provider}, model: ${model || 'default'}`)

    switch (provider) {
      case 'openai':
        return await generateWithOpenAI(apiKey, model, prompt, temperature, maxTokens)

      case 'gemini':
        return await generateWithGemini(apiKey, model, prompt, temperature)

      case 'claude':
        return await generateWithClaude(apiKey, model, prompt, temperature, maxTokens)

      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }
  } catch (error) {
    console.error('Error generating blog post with AI:', error)
    throw error
  }
}
