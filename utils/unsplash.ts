import { createApi } from 'unsplash-js'
import { UnsplashImage } from '@/types'

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
})

export async function searchImages(
  keywords: string[],
  count: number = 3
): Promise<UnsplashImage[]> {
  try {
    const query = keywords.join(' ')

    const result = await unsplash.search.getPhotos({
      query,
      page: 1,
      perPage: count,
      orientation: 'landscape',
    })

    if (result.errors) {
      console.error('Unsplash API errors:', result.errors)
      return []
    }

    const photos = result.response?.results || []

    // Unsplash API 가이드라인: 이미지 사용 시 다운로드 트리거
    const mappedPhotos = await Promise.all(
      photos.map(async (photo) => {
        try {
          // Track download (required by Unsplash API guidelines)
          await unsplash.photos.trackDownload({ downloadLocation: photo.links.download_location })
        } catch (error) {
          console.error('Error tracking download:', error)
        }

        return {
          id: photo.id,
          urls: {
            raw: photo.urls.raw,
            full: photo.urls.full,
            regular: photo.urls.regular,
            small: photo.urls.small,
            thumb: photo.urls.thumb,
          },
          alt_description: photo.alt_description,
          user: {
            name: photo.user.name,
            username: photo.user.username,
          },
        }
      })
    )

    return mappedPhotos
  } catch (error) {
    console.error('Error searching images from Unsplash:', error)
    return []
  }
}
