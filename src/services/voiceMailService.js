import { faker } from '@faker-js/faker'
import axios from 'axios'
import dayjs from 'dayjs'

const BASE_URL = import.meta.env.VITE_VOICE_API_URL

function generateFakePhoneNumber(name = 'Unnamed', seed = null) {
  if (seed) {
    faker.seed(seed)
  }

  const vanityString = name
    .replace(/[^A-Za-z0-9]+/g, '')
    .substring(0, 9)
    .toUpperCase()

  const basePhone = faker.helpers.replaceSymbols('(+62) 8##-####-####')

  const phoneNumber = vanityString.padStart(19, basePhone)

  return phoneNumber
}

/**
 * @deprecated
 */
export async function _fetchVoiceMails() {
  const safeVoicemailsUrl = new URL('/api/voicemail/safe', BASE_URL)
  const response = await axios.get(safeVoicemailsUrl.href)

  const voicemails = response.data.map((voicemail) => {
    const seed = voicemail.owner_id.split('-')[0]
    voicemail.phone_number = generateFakePhoneNumber(voicemail.name, parseInt(seed, 16))
    return voicemail
  })

  return voicemails
}

export async function fetchVoiceMails() {
  const response = await axios.get('/voicemail-list.txt')
  const fileList = response.data.trim().split('\n')

  const voicemails = fileList
    .map((filename) => {
      const matchPattern = /(\d+)-([0-9A-Za-z-]+).mp4$/
      const matches = filename.match(matchPattern)

      console.log('matches', matches)

      return {
        owner_id: matches[2],
        name: matches[2].replaceAll('-', ' '),
        created_at: dayjs(Number(matches[1])),
        audio_url: new URL(filename, import.meta.env.VITE_VOICEMAIL_STORAGE_BASEURL),
        duration: null,
      }
    })
    .map((voicemail) => {
      const seed = voicemail.owner_id.split('-')[0]
      voicemail.phone_number = generateFakePhoneNumber(voicemail.name, parseInt(seed, 16))
      return voicemail
    })
  return voicemails
}
