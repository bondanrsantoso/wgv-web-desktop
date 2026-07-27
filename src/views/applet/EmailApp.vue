<script setup>
import ClassicButton from '@/components/ClassicButton.vue'
import { getSpreadsheetData } from '@/services/spreadsheetService'
// import { fakerID_ID as faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import RelativeTime from 'dayjs/plugin/relativeTime'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import ClassicIcon from '@/components/ClassicIcon.vue'
import { resolveProfile } from '@/config/profile'
import axios from 'axios'

dayjs.extend(RelativeTime)

// const fakeEmails = reactive(
//   Array.apply(null, Array(40)).map(() => ({
//     name: faker.person.fullName(),
//     username: faker.internet.username(),
//     subject: faker.word.words({ min: 3, max: 10 }),
//     body: faker.lorem.paragraphs({ min: 1, max: 20 }, '<br> \n'),
//     timestamp: faker.date.recent({ days: 15 }),
//   })),
// )

const emails = reactive([])

/**
 * Parse date value coming from the Google Spreadsheet
 * @param dateString {string} Google docs Date string in `'Date(Y,M,D,H,m,s)'` format
 * @returns {Date}
 */
function parseSpreadsheetDate(dateString) {
  // The date is originally formatted like
  // Date(year,month,day,hour,minute,second)

  const cleaned = dateString.substring(5, dateString.length - 1)
  const [Y, M, D, H, m, s] = cleaned.split(',')

  const date = new Date(Y, M, D, H, m, s)

  return date
}

const selectedProfileName = ref(null)
const selectedProfile = computed(() =>
  selectedProfileName.value ? resolveProfile(selectedProfileName.value) : null,
)
const isFromTweet = computed(() => (selectedProfile.value.tweets ? true : false))

watch(selectedProfile, async (profile) => {
  // console.log({profile})
  if (profile.tweets?.length > 0) {
    for (const tweetDataUrl of profile.tweets) {
      try {
        const response = await axios.get(tweetDataUrl)
        const { tweets } = response.data
        for (const tweet of tweets) {
          if (tweet.username === '@wargavirtual48' || tweet.username === '@tana_jkt48v') continue
          const sanitizedLetter = DOMPurify.sanitize(tweet.text)
          emails.push({
            name: tweet.displayName,
            username: tweet.username,
            tweetUrl: tweet.tweetUrl,
            subject: tweet.text.slice(0, 50) + '...',
            body: sanitizedLetter.replaceAll('\n', '<br/>'),
            timestamp: new Date(tweet.timestamp),
            attachments: tweet.media?.images?.length > 0 ? tweet.media?.images : null,
            quoted: tweet.quoted
              ? {
                  name: tweet.quoted.displayName,
                  username: tweet.quoted.username,
                  subject: tweet.quoted.text.slice(0, 100) + '...',
                  body: tweet.quoted.text.replaceAll('\n', '<br/>'),
                  timestamp: new Date(tweet.quoted.timestamp),
                  attachments: tweet.quoted.media?.images?.length > 0 ? tweet.media?.images : null,
                }
              : null,
          })
        }
      } catch (e) {
        console.error('Failed to fetch tweets', e)
      }
    }
  } else {
    const submission = await getSpreadsheetData()

    for (const item of submission) {
      const sanitizedLetter = DOMPurify.sanitize(item.fanLetter)
      emails.push({
        name: item.name,
        username: item.name,
        subject: item.fubject,
        body: sanitizedLetter.replaceAll('\n', '<br/>'),
        timestamp: parseSpreadsheetDate(item.timestamp),
        attachments: item.fanSubmission ? [item.fanSubmission] : null,
      })
    }
  }
})

onMounted(async () => {
  if (window.localStorage.getItem('profile')) {
    selectedProfileName.value = window.localStorage.getItem('profile')
  } else {
    selectedProfileName.value = 'kanaia'
  }
})

const activeMailIndex = ref(null)

const currentMail = computed(() => {
  if (activeMailIndex.value === null) return null

  return emails[activeMailIndex.value]
})

/**
 * Parse Google drive open link and turn it into google drive preview URL
 * @param attachmentUrl {string} Google Drive file URL in the format of `https://drive.google.com/open?id=[FILE_ID]`
 * @returns {string}
 */
function getDriveEmbeddingURL(attachmentUrl) {
  const url = new URL(attachmentUrl)
  if (!/google/i.test(url.hostname)) {
    return attachmentUrl
  }

  const fileId = url.searchParams.get('id')

  return `https://drive.google.com/file/d/${fileId}/preview`
}

watch(activeMailIndex, () => {
  isAttachmentOpen.value = false
})

const isAttachmentOpen = ref(false)
const attachmentFrame = ref(null)

function handleAttachmentLoad() {
  console.log('Attachment Loaded')

  /**
   * @type {HTMLIFrameElement}
   */
  const iframe = attachmentFrame.value
  iframe.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div
    class="flex flex-col h-screen w-screen overflow-hidden"
    v-if="selectedProfile"
    :class="[`theme-${selectedProfile.theme || 'kanaia'}`]"
  >
    <header class="bg-gray-200 shrink-0 p-4 flex flex-row flex-nowrap items-center">
      <ClassicButton
        class="p-1 px-2 group"
        :disabled="activeMailIndex === null || activeMailIndex < 1"
        @click="() => activeMailIndex--"
      >
        <ClassicIcon name="arrow-left" class="w-6 group-disabled:opacity-50"></ClassicIcon>
      </ClassicButton>
      <ClassicButton
        class="p-1 px-2 group"
        :disabled="activeMailIndex === null || activeMailIndex === emails.length - 1"
        @click="() => activeMailIndex++"
      >
        <ClassicIcon name="arrow-right" class="w-6 group-disabled:opacity-50"></ClassicIcon>
      </ClassicButton>
      <ClassicButton
        v-if="activeMailIndex !== null"
        class="px-2 p-1 md:hidden ms-2"
        @click="() => (activeMailIndex = null)"
      >
        <ClassicIcon name="mailbox" class="w-6"></ClassicIcon>
        Inbox
      </ClassicButton>

      <div class="ms-auto">
        <img
          :src="selectedProfile.photo"
          alt="kanaia profile"
          class="inline-block w-8 border me-2"
        />
        <span>
          <b>{{ selectedProfile.displayName }}</b>
        </span>
      </div>
    </header>
    <div class="grow-0 bg-gray-200 flex gap-2 flex-row flex-nowrap relative overflow-x-hidden">
      <div
        class="w-full h-full md:w-1/4 md:block border-3 border-inset overflow-y-auto"
        :class="{
          // 'w-full': activeMailIndex === null,
          hidden: activeMailIndex !== null,
        }"
      >
        <!-- <h1 class="text-2xl font-bold">Inbox</h1>
        <hr class="pt-4" /> -->
        <div class="w-full grid grid-cols-1 divide-solid divide-y-1 divide-gray-400 select-none">
          <button
            class="space-y-1 py-2 px-4 block text-start hover:bg-primary hover:text-white"
            :class="{ 'bg-primary text-white': activeMailIndex === i }"
            v-for="(email, i) in emails"
            :key="`${i}${email.username}`"
            @click="() => (activeMailIndex = i)"
          >
            <p class="font-bold">
              <span class="bi-paperclip me-1" v-if="email.attachments"></span>
              {{ email.username }}
            </p>
            <p class="text-nowrap truncate">{{ email.subject }}</p>
          </button>
        </div>
      </div>
      <div
        class="w-full h-full border-4 border-inset p-6 hidden md:flex items-center justify-center"
        v-if="activeMailIndex === null"
      >
        Select one mail from your inbox to read
      </div>
      <div
        class="w-full h-full border-4 border-inset overflow-y-auto py-6"
        v-if="activeMailIndex !== null"
      >
        <div class="max-w-7xl mx-auto px-6 lg:px-8 text-lg">
          <div class="flex flex-row flex-nowrap items-end border-b pb-4">
            <div class="space-y-1">
              <div class="flex flex-row gap-2">
                <div class="text-start">From:</div>
                <b>{{ currentMail.name }} - {{ currentMail.username }}</b>
              </div>
              <div class="flex flex-row gap-2">
                <div class="text-start">To:</div>
                <b>{{ selectedProfile.displayName }}</b>
              </div>
              <div class="flex flex-row gap-2">
                <div class="text-start">Subject:</div>
                <b>{{ currentMail.subject }}</b>
              </div>
              <div v-if="currentMail.attachments?.length > 0" class="flex flex-row gap-2">
                <div class="text-start">Attachment:</div>
                <b>{{ currentMail.attachments?.length }} Attachment(s)</b>
              </div>
              <div v-if="currentMail.tweetUrl">
                <ClassicButton
                  is="a"
                  :href="currentMail.tweetUrl"
                  target="_blank"
                  class="px-4 py-1"
                >
                  <span class="bi-box-arrow-up-right me-2"></span>
                  View Original
                </ClassicButton>
              </div>
            </div>
            <div class="text-end ms-auto">
              {{ dayjs(currentMail.timestamp).fromNow() }}
            </div>
          </div>

          <div class="py-4 prose-md mx-auto bg-white px-8">
            <!-- Email Body -->
            <div v-html="currentMail.body"></div>
            <div v-if="currentMail.quoted" class="mt-2 text-purple-800">
              <hr class="my-4" />
              <p>
                Quoting:
                <strong>{{ currentMail.quoted.name }}</strong>
                ({{ currentMail.quoted.username }})
              </p>
              <p>
                {{ dayjs(currentMail.quoted.timestamp).fromNow() }}
              </p>
              <div class="mt-2" v-html="currentMail.quoted.body"></div>
              <!-- <pre>
                {{ JSON.stringify(currentMail.quoted, null, 2) }}
              </pre> -->
            </div>
          </div>

          <div v-if="currentMail.attachments?.length > 0" class="mt-6">
            <h3 class="text-lg font-bold">Attachment(s)</h3>
            <div class="mt-2 relative">
              <ClassicButton @click="() => (isAttachmentOpen = true)" v-if="!isAttachmentOpen">
                <span class="bi-paperclip me-2"></span>
                View {{ currentMail.attachments?.length }} Attachment(s)
              </ClassicButton>
              <template v-if="isAttachmentOpen && !isFromTweet">
                <!-- Drive Embed view -->
                <div
                  v-if="isAttachmentOpen"
                  class="absolute w-full h-full flex items-center justify-center bg-gray-300"
                >
                  <img src="/hourglass.gif" alt="" class="w-8 h-8" />
                </div>
                <iframe
                  v-for="attachment in currentMail.attachments"
                  :key="attachment"
                  :src="getDriveEmbeddingURL(attachment)"
                  class="w-full h-[80vh] relative"
                  frameborder="0"
                ></iframe>
              </template>
              <div
                class="w-full flex flex-row flex-wrap gap-4"
                v-if="isAttachmentOpen && isFromTweet"
              >
                <div
                  v-for="attachment in currentMail.attachments"
                  class="min-w-1/3 max-w-full grow"
                  :key="attachment"
                >
                  <img :src="attachment" class="w-full" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer class="mt-auto border-4 border-inset bg-gray-300 px-2">
      {{ emails.length }} mails
    </footer>
  </div>
</template>
