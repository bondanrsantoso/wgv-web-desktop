/**
 * Service untuk mengelola data album foto
 * Ini memungkinkan pengambilan data foto secara dinamis dari berbagai sumber
 */

import { generateDriveEmbedUrl } from '@/utils/generatedDriveEmbedUrl'
import { getSpreadsheetData } from './spreadsheetService'
import axios from 'axios'
import { resolveProfile } from '@/config/profile'

/**
 * Mengambil data foto dari API atau sumber data lainnya
 * @returns {Promise<Array>} Array berisi data foto
 */
export async function getPhotoAlbumData() {
  const datas = await getSpreadsheetData()
  // TODO: Implementasi pengambilan data dari API atau database
  // Contoh implementasi dengan data statis untuk sementara
  // Nantinya bisa diganti dengan fetch dari API atau database

  // Simulasi delay seperti network request
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Data links yang nantinya bisa diambil dari API/database

  // Filter data yang memiliki fanSubmission valid, lalu mapping ke objek foto
  return datas
    .filter((data) => data.fanSubmission)
    .map((data, i) => {
      const { directGuess, iframeUrl, embedUrl, thumbnailUrl } = generateDriveEmbedUrl(
        data.fanSubmission,
      )

      return {
        id: i,
        filename: `${i + 1}.jpg`,
        name: data.name || 'Fanart',
        url: directGuess,
        iframeUrl,
        thumbnailUrl,
        embedUrl,
        selected: false,
        rotation: 0,
      }
    })
}

/**
 * Mengambil data foto berdasarkan ID
 * @param {number} id - ID foto yang ingin diambil
 * @returns {Promise<Object|null>} Data foto atau null jika tidak ditemukan
 */
export async function getPhotoById(id) {
  const photos = await getPhotoAlbumData()
  return photos.find((photo) => photo.id === id) || null
}

export async function getLocalPhotoList() {
  const profileName = window.localStorage.getItem('profile') || 'kanaia'
  const profile = resolveProfile(profileName)

  if (profile.photoAlbum) {
    return getTwitterScrapedImages(profile.photoAlbum)
  }
  const response = await axios.get('/fanarts/credits.txt')

  /**
   * @type {string}
   */
  const usernames = response.data
  const usernameList = usernames.split('\n')
  const photoList = usernameList.map((u, i) => ({
    name: u,
    url: `/fanarts/${i + 1}.png`,
    filename: `${i + 1}.png`,
    creditsUrl: `https://twitter.com/${u.replace('@', '')}`,
  }))

  return photoList
}

async function getTwitterScrapedImages(albumName) {
  const response = await axios.get(`/fanarts/data/${albumName}.json`)
  const { tweets } = response.data

  if (!Array.isArray(tweets)) {
    console.error('Scraped tweets is not a valid array')
    return []
  }
  const photoLists = []
  for (const t of tweets) {
    for (const image of t.media?.images || []) {
      const [baseResource] = image.split("?");
      photoLists.push({
          name: t.displayName || t.username,
          url: `${baseResource}?format=webp&name=large`,
          filename: t.tweetUrl.split("/").pop() + ".webp",
          creditsUrl: t.tweetUrl,
        })
    }
  }

  return photoLists;
}
