<script setup lang="ts">
import ClassicButton from '@/components/ClassicButton.vue'
import ClassicIcon from '@/components/ClassicIcon.vue'
import { ref, computed } from 'vue'
import { profiles, resolveProfile } from "@/config/profile"

const selectedProfile = ref("kanaia");
const selectedTheme = computed(() => resolveProfile(selectedProfile.value).theme)

const showHelp = ref(false)

const emits = defineEmits(['login'])
function handleLogin() {
  emits('login', selectedProfile.value)
}
</script>

<template>
  <div
    class="fixed w-screen h-screen z-50 bg-blue-300 flex justify-center items-center overflow-hidden select-none"
    :class="[`theme-${selectedTheme}`]"
  >
    <div class="border-1 border-black m-10">
      <div class="border-4 border-outset bg-gray-300 max-w-xl">
        <div
          class="w-full bg-linear-to-r from-kana-blue to-kana-purple font-bold p-1 px-2 flex flex-row items-center gap-2"
        >
          <ClassicIcon name="padlock" class="w-6" />
          <p>Login</p>
        </div>
        <div class="w-full p-4 space-y-4">
          <div class="bg-white border border-black">
            <div v-for="(profile, key) in profiles" @click="() => {selectedProfile = key}" class="flex flex-row gap-2 px-2 py-3 items-center" :key="key" :class="{'bg-primary text-white': key === selectedProfile}">
              <img :src="profile.photo" alt="" class="inline-block w-12 me-6 border-2 border-outset" />
              <p class="font-bold text-lg">{{profile.displayName}}</p>
            </div>
          </div>
          <form class="space-y-4" @submit.prevent="handleLogin">
            <div class="flex flex-row gap-4 items-center">
              <!-- <ClassicIcon name="padlock" class="w-6" /> -->
              <label>Password</label>
              <input type="password" class="bg-white border border-black px-1" />
            </div>
            <p v-if="showHelp">Hint: passwordnya bebas</p>
            <div class="flex flex-row w-full gap-2">
              <ClassicButton class="w-full" type="button" @click="() => (showHelp = true)">
                Help
              </ClassicButton>
              <ClassicButton class="w-full" type="submit">Sign in</ClassicButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
