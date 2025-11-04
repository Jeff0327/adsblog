-- AdBlog 샘플 데이터
-- Supabase SQL Editor에서 실행하세요

-- 1. 블로그 설정 (이미 있다면 업데이트, 없으면 삽입)
INSERT INTO blog_settings (
  site_title,
  site_description,
  site_url,
  adsense_enabled,
  adsense_client_id,
  adsense_sidebar_slot,
  adsense_in_article_slot
)
VALUES (
  'TechBlog',
  'AI로 자동 생성되는 기술 블로그 - 매일 새로운 인사이트를 제공합니다',
  'http://localhost:3000',
  false,
  null,
  null,
  null
)
ON CONFLICT (id) DO UPDATE
SET
  site_title = EXCLUDED.site_title,
  site_description = EXCLUDED.site_description,
  site_url = EXCLUDED.site_url;

-- 2. 카테고리
INSERT INTO categories (name, slug, description, order_index)
VALUES
  ('기술', 'technology', '최신 기술 트렌드와 개발 이야기', 1),
  ('AI & 머신러닝', 'ai-ml', '인공지능과 머신러닝 관련 글', 2),
  ('웹 개발', 'web-dev', '프론트엔드/백엔드 개발', 3),
  ('라이프스타일', 'lifestyle', '개발자의 일상과 생활', 4),
  ('비즈니스', 'business', '스타트업과 비즈니스 인사이트', 5)
ON CONFLICT (slug) DO NOTHING;

-- 3. SEO 키워드
INSERT INTO seo_keywords (keyword, is_global, category_id)
VALUES
  -- 전역 키워드
  ('개발', true, NULL),
  ('프로그래밍', true, NULL),
  ('코딩', true, NULL),
  ('IT', true, NULL),
  ('기술', true, NULL),
  -- 카테고리별 키워드
  ('JavaScript', false, (SELECT id FROM categories WHERE slug = 'web-dev')),
  ('React', false, (SELECT id FROM categories WHERE slug = 'web-dev')),
  ('Next.js', false, (SELECT id FROM categories WHERE slug = 'web-dev')),
  ('인공지능', false, (SELECT id FROM categories WHERE slug = 'ai-ml')),
  ('딥러닝', false, (SELECT id FROM categories WHERE slug = 'ai-ml')),
  ('ChatGPT', false, (SELECT id FROM categories WHERE slug = 'ai-ml')),
  ('스타트업', false, (SELECT id FROM categories WHERE slug = 'business')),
  ('개발자', false, (SELECT id FROM categories WHERE slug = 'lifestyle'))
ON CONFLICT DO NOTHING;

-- 4. 샘플 블로그 글
INSERT INTO posts (
  title,
  slug,
  content,
  excerpt,
  category_id,
  seo_title,
  seo_description,
  seo_keywords,
  og_image,
  published,
  published_at,
  view_count
)
VALUES
  (
    'Next.js 15의 새로운 기능들',
    'nextjs-15-new-features',
    '<h2>Next.js 15 주요 업데이트</h2>
    <p>Next.js 15가 출시되면서 여러 혁신적인 기능들이 추가되었습니다. 이번 글에서는 가장 주목할 만한 변화들을 살펴보겠습니다.</p>

    <h3>1. React 19 지원</h3>
    <p>Next.js 15는 React 19를 완벽하게 지원합니다. 새로운 Server Components와 Actions를 활용할 수 있습니다.</p>

    <h3>2. 향상된 성능</h3>
    <p>빌드 속도가 40% 향상되었으며, 런타임 성능도 크게 개선되었습니다.</p>

    <h3>3. 새로운 캐싱 전략</h3>
    <p>더 세밀한 캐싱 제어가 가능해졌습니다. fetch API의 캐싱 옵션이 더욱 강력해졌습니다.</p>

    <p>Next.js 15는 개발자 경험과 성능 모두를 크게 향상시킨 업데이트입니다.</p>',
    'Next.js 15의 주요 업데이트와 새로운 기능들을 상세히 알아봅니다. React 19 지원, 성능 개선, 새로운 캐싱 전략 등을 다룹니다.',
    (SELECT id FROM categories WHERE slug = 'web-dev'),
    'Next.js 15 완벽 가이드 - 새로운 기능과 업데이트',
    'Next.js 15의 React 19 지원, 성능 향상, 캐싱 전략 등 주요 기능을 상세히 설명합니다.',
    ARRAY['Next.js', 'React', '웹개발', 'JavaScript', '프론트엔드'],
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',
    true,
    NOW() - INTERVAL '2 days',
    245
  ),
  (
    'AI 시대의 개발자 역할',
    'ai-era-developer-role',
    '<h2>AI가 바꾸는 개발 환경</h2>
    <p>ChatGPT, GitHub Copilot 등 AI 도구들이 개발자의 일상을 크게 변화시키고 있습니다.</p>

    <h3>AI 코딩 어시스턴트의 등장</h3>
    <p>AI는 더 이상 미래의 기술이 아닙니다. 지금 이 순간에도 수많은 개발자들이 AI의 도움을 받아 코드를 작성하고 있습니다.</p>

    <h3>개발자가 집중해야 할 것</h3>
    <ul>
      <li>문제 정의와 아키텍처 설계</li>
      <li>코드 리뷰와 품질 관리</li>
      <li>비즈니스 로직 이해</li>
      <li>팀 커뮤니케이션</li>
    </ul>

    <h3>AI와 함께 성장하기</h3>
    <p>AI는 경쟁자가 아닌 협력자입니다. AI를 효과적으로 활용하는 개발자가 미래를 이끌어갈 것입니다.</p>',
    'AI 시대에 개발자의 역할은 어떻게 변화하고 있을까요? ChatGPT와 Copilot 같은 AI 도구가 개발 환경에 미치는 영향을 분석합니다.',
    (SELECT id FROM categories WHERE slug = 'ai-ml'),
    'AI 시대, 개발자는 무엇을 준비해야 할까?',
    'ChatGPT, GitHub Copilot 등 AI 도구가 개발자의 역할을 어떻게 변화시키는지 알아봅니다.',
    ARRAY['AI', '개발자', 'ChatGPT', 'Copilot', '미래'],
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200',
    true,
    NOW() - INTERVAL '5 days',
    512
  ),
  (
    'React Server Components 완벽 이해하기',
    'react-server-components-guide',
    '<h2>Server Components란?</h2>
    <p>React Server Components는 서버에서 렌더링되는 새로운 유형의 컴포넌트입니다.</p>

    <h3>주요 특징</h3>
    <ol>
      <li><strong>Zero Bundle Size</strong>: 클라이언트 번들 크기가 0</li>
      <li><strong>Direct Server Access</strong>: 데이터베이스 직접 접근</li>
      <li><strong>Automatic Code Splitting</strong>: 자동 코드 분할</li>
    </ol>

    <h3>사용 예시</h3>
    <pre><code>async function BlogPost({ id }) {
  const post = await db.posts.findById(id)
  return &lt;article&gt;{post.content}&lt;/article&gt;
}</code></pre>

    <h3>주의사항</h3>
    <p>Server Components에서는 useState, useEffect 같은 React Hooks를 사용할 수 없습니다. 인터랙티브한 기능이 필요하면 Client Component를 사용하세요.</p>',
    'React Server Components의 개념과 활용법을 예제와 함께 상세히 알아봅니다. Next.js에서의 실전 활용 방법도 다룹니다.',
    (SELECT id FROM categories WHERE slug = 'web-dev'),
    'React Server Components 실전 가이드',
    'Server Components의 개념, 특징, 활용법을 실제 예제와 함께 설명합니다.',
    ARRAY['React', 'Server Components', 'Next.js', 'SSR'],
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200',
    true,
    NOW() - INTERVAL '1 day',
    189
  ),
  (
    '효율적인 개발자 루틴 만들기',
    'developer-daily-routine',
    '<h2>생산성 높은 개발자의 하루</h2>
    <p>성공적인 개발자들은 어떤 루틴을 가지고 있을까요?</p>

    <h3>아침 루틴</h3>
    <ul>
      <li>코드 리뷰부터 시작하기</li>
      <li>우선순위 작업 정리</li>
      <li>팀 데일리 스탠드업</li>
    </ul>

    <h3>집중 시간 확보</h3>
    <p>깊은 집중이 필요한 작업은 오전에 배치하고, 회의나 소통은 오후에 몰아서 처리합니다.</p>

    <h3>학습 시간</h3>
    <p>매일 30분씩 새로운 기술을 학습하는 습관을 들이세요. 꾸준함이 가장 중요합니다.</p>

    <h3>저녁 루틴</h3>
    <ul>
      <li>오늘 작성한 코드 리뷰</li>
      <li>내일 할 일 정리</li>
      <li>개발 블로그나 커뮤니티 활동</li>
    </ul>',
    '생산성 높은 개발자가 되기 위한 효율적인 루틴을 소개합니다. 아침부터 저녁까지의 시간 관리 전략을 공유합니다.',
    (SELECT id FROM categories WHERE slug = 'lifestyle'),
    '개발자 생산성을 높이는 데일리 루틴',
    '효율적인 시간 관리와 루틴으로 생산성을 높이는 방법을 알아봅니다.',
    ARRAY['개발자', '생산성', '루틴', '습관', '시간관리'],
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200',
    true,
    NOW() - INTERVAL '3 days',
    378
  ),
  (
    '스타트업 개발자로 성장하기',
    'startup-developer-growth',
    '<h2>스타트업에서의 개발</h2>
    <p>대기업과는 다른 스타트업 개발 환경에 대해 알아봅니다.</p>

    <h3>빠른 의사결정</h3>
    <p>스타트업에서는 완벽함보다 속도가 중요합니다. MVP를 빠르게 출시하고 피드백을 받는 것이 핵심입니다.</p>

    <h3>다양한 경험</h3>
    <p>프론트엔드, 백엔드, 인프라까지 다양한 영역을 경험할 수 있습니다. 풀스택 개발자로 성장하기 좋은 환경입니다.</p>

    <h3>비즈니스 이해</h3>
    <p>기술뿐만 아니라 비즈니스 관점에서 생각하는 능력이 중요합니다. 제품의 방향성을 이해하고 제안할 수 있어야 합니다.</p>

    <h3>도전과 기회</h3>
    <p>불확실성이 높지만 그만큼 성장 기회도 많습니다. 주도적으로 일하고 싶은 개발자에게 최고의 환경입니다.</p>',
    '스타트업 개발자로서의 경험과 성장 스토리를 공유합니다. 대기업과 다른 환경에서 얻을 수 있는 것들을 이야기합니다.',
    (SELECT id FROM categories WHERE slug = 'business'),
    '스타트업 개발자가 되기 전에 알아야 할 것들',
    '스타트업 환경의 특징과 개발자로서의 성장 기회를 알아봅니다.',
    ARRAY['스타트업', '개발자', '커리어', '성장', '비즈니스'],
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200',
    true,
    NOW() - INTERVAL '4 days',
    421
  );

-- 5. 포스트 이미지 (각 글에 2-3개씩)
INSERT INTO post_images (post_id, image_url, alt_text, order_index)
VALUES
  -- Next.js 글 이미지
  (
    (SELECT id FROM posts WHERE slug = 'nextjs-15-new-features'),
    'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?w=800',
    'Next.js 로고와 코드',
    0
  ),
  (
    (SELECT id FROM posts WHERE slug = 'nextjs-15-new-features'),
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    '개발 중인 노트북',
    1
  ),
  -- AI 글 이미지
  (
    (SELECT id FROM posts WHERE slug = 'ai-era-developer-role'),
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
    'AI와 로봇',
    0
  ),
  (
    (SELECT id FROM posts WHERE slug = 'ai-era-developer-role'),
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=800',
    'AI 인터페이스',
    1
  ),
  -- React 글 이미지
  (
    (SELECT id FROM posts WHERE slug = 'react-server-components-guide'),
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    'React 코드',
    0
  );

-- 확인 쿼리
SELECT
  p.title,
  p.slug,
  c.name as category,
  p.published,
  p.view_count,
  (SELECT COUNT(*) FROM post_images WHERE post_id = p.id) as image_count
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.published_at DESC;
