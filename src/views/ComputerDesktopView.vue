<script setup>
import ClassicButton from '@/components/ClassicButton.vue'
import ClassicIcon from '@/components/ClassicIcon.vue'
import DesktopIcon from '@/components/DesktopIcon.vue'
import DraggableWindow from '@/components/DraggableWindow.vue'
import dayjs from 'dayjs'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { apps, desktopIcons as icons } from '../config/desktop'
import BootScreen from './BootScreen.vue'
import LoginScreen from './LoginScreen.vue'
import ShutdownScreen from './ShutdownScreen.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { TargetIcon } from '@lucide/vue'
import { resolveProfile } from '@/config/profile'

const clockNow = ref(dayjs().format('HH:mm:dd'))

const runningApps = reactive([])
const activeApp = computed(() => {
  const [active] = runningApps.filter((app) => app.active)
  return active
})

/**
 * Launch an app from the `apps` array
 * @param index {number}
 */
function openApplet(index) {
  const selectedApp = apps[index] || desktopIcons[index]

  let appAlreadyRunning = false
  for (const app of runningApps) {
    app.active = false
    if (app.contentUrl === selectedApp.appletUrl) {
      app.active = true
      appAlreadyRunning = true
    }
  }

  if (!appAlreadyRunning) {
    runningApps.push({
      title: selectedApp.label,
      icon: selectedApp.icon,
      active: true,
      maximized: false,
      minimized: false,
      minWidth: selectedApp.windowSetting.minWidth,
      minHeight: selectedApp.windowSetting.minHeight,
      contentUrl: selectedApp.appletUrl,
    })
  }

  startMenuOpen.value = false
}

const desktopIcons = reactive(
  icons.map((i) => {
    i.selected = false
    return i
  }),
)

const iconSelectStartIndex = ref(0)

/**
 * Handle desktop icon click
 * @param e {MouseEvent}
 * @param i {number} index of the icon
 */
function handleDesktopIconClick(e, i) {
  if (!e.ctrlKey) {
    for (const icon of desktopIcons) {
      icon.selected = false
    }

    if (e.shiftKey) {
      const start = Math.min(i, iconSelectStartIndex.value)
      const end = Math.max(i, iconSelectStartIndex.value)
      for (let x = start; x <= end; x++) {
        desktopIcons[x].selected = true
      }
    } else {
      iconSelectStartIndex.value = i
    }
  }

  desktopIcons[i].selected = true
}

function openSelectedApps() {
  let i = 0
  for (const app of desktopIcons) {
    if (app.selected) {
      openApplet(i)
    }
    i++
  }
}

function clearIconSelection() {
  for (const icon of desktopIcons) {
    icon.selected = false
  }
}

function handleWindowMaximize(i) {
  runningApps[i].maximized = true
}

function handleWindowMinimize(i) {
  runningApps[i].maximized = false
  runningApps[i].minimized = true
  runningApps[i].active = false
}

function handleWindowRestore(i) {
  runningApps[i].minimized = false
  runningApps[i].maximized = false
}

function handleClose(i) {
  runningApps.splice(i, 1)
}

function activateWindow(i) {
  for (const app of runningApps) {
    app.active = false
  }
  runningApps[i].active = true
  runningApps[i].minimized = false
}

const startMenuOpen = ref(true)

function restart() {
  window.location.reload()
}

const booting = ref(true)
const bootScreenDuration = 5000 // ms

const isLoggedIn = ref(false)
const isShuttingDown = ref(false)

function shutdown() {
  isShuttingDown.value = true
}

onMounted(() => {
  setInterval(() => {
    clockNow.value = dayjs().format('HH : mm : ss')
  }, 1000)

  setTimeout(() => {
    booting.value = false
  }, bootScreenDuration)
})

function makeIconAppear(el) {
  // Make it seemingly appear at random
  setTimeout(
    () => {
      el.classList.remove('opacity-0')
    },
    200 + Math.random() * 500,
  )
}

const isFullscreen = ref(false)
const rootContainer = ref(null)

function fullscreenChange() {
  console.log('Fullscreen state changed', document.fullscreenElement)
  if (document.fullscreenElement) {
    isFullscreen.value = true
  } else {
    isFullscreen.value = false
  }
}

function toggleFullscreen() {
  if (isFullscreen.value) {
    document.exitFullscreen()
  } else {
    rootContainer.value.requestFullscreen()
  }
}

const selectedProfile = ref('kanaia')
const selectedTheme = computed(() => resolveProfile(selectedProfile.value).theme)
const selectedWallpaper = computed(() => resolveProfile(selectedProfile.value).wallpaper)
const additionalDesktopIcons = computed(
  () => resolveProfile(selectedProfile.value).desktopItems || [],
)

function handleLogin(profile) {
  selectedProfile.value = profile
  isLoggedIn.value = true
  window.localStorage.setItem('profile', profile)
}

watch(additionalDesktopIcons, (addedIcons) => {
  if (addedIcons?.length > 0) {
    desktopIcons.length = 0
    for (const i of icons) {
      desktopIcons.push({ ...i, selected: false })
    }
    for (const i of addedIcons) {
      desktopIcons.push({ ...i, selected: false })
    }
  }
})

const menubarContents = computed(() => [
  {
    label: TargetIcon,
    items: [
      {
        label: 'Log out',
        onClick() {
          runningApps.length = 0
          isLoggedIn.value = false
          selectedProfile.value = "kanaia"
        },
      },
      {
        label: 'Restart',
        onClick() {
          restart()
        },
      },
      {
        label: 'Shut Down',
        onClick() {
          shutdown()
        },
      },
    ],
  },
  ...(activeApp.value
    ? [
        {
          label: activeApp.value.title,
          items: [
            {
              label: `Quit ${activeApp.value.title}`,
              onClick() {
                let i = 0
                for (const app of runningApps) {
                  if (app.active) {
                    handleClose(i)
                    return
                  }
                  i++
                }
              },
            },
          ],
        },
      ]
    : []),
  {
    label: 'Programs',
    items: apps.map((app, i) => ({
      label: app.label,
      onClick() {
        openApplet(i)
      },
    })),
  },
  {
    label: 'Window',
    items: [
      {
        label: 'Maximize',
        onClick() {
          let i = 0
          for (const app of runningApps) {
            if (app.active) {
              handleWindowMaximize(i)
              return
            }
            i++
          }
        },
        disabled: !activeApp.value || activeApp.value?.maximized,
      },
      {
        label: 'Restore',
        onClick() {
          let i = 0
          for (const app of runningApps) {
            if (app.active) {
              handleWindowRestore(i)
              return
            }
            i++
          }
        },
        disabled: !activeApp.value || !activeApp.value?.maximized,
      },
      {
        label: 'Close',
        onClick() {
          let i = 0
          for (const app of runningApps) {
            if (app.active) {
              handleClose(i)
              return
            }
            i++
          }
        },
        disabled: !activeApp.value,
      },
    ],
  },
])

const submenuOpen = ref(false)
</script>

<template>
  <div
    class="w-full h-lvh overflow-hidden"
    ref="rootContainer"
    :class="[`theme-${selectedTheme}`]"
    @fullscreenchange="fullscreenChange"
  >
    <BootScreen v-if="booting" />
    <LoginScreen v-if="!booting && !isLoggedIn" @login="handleLogin" />
    <ShutdownScreen v-if="isShuttingDown" />
    <div
      id="desktop-main"
      class="w-screen h-screen overflow-hidden flex flex-col items-stretch z-20 select-none"
    >
      <!-- MacOS-like top bar -->
      <nav class="w-full bg-stone-200 px-2 overflow-y-visible border-b border-stone-800">
        <div class="nav-items flex items-center h-8 overflow-y-visible">
          <!-- <div class="h-5">
            <TargetIcon class="h-full" />
          </div> -->
          <div
            v-for="(menu, i) in menubarContents"
            :key="i"
            class="relative px-3 h-full hover:bg-primary overflow-y-visible group"
          >
            <button
              @click="
                () => {
                  submenuOpen = !submenuOpen
                }
              "
              class="h-full hover:text-white group-hover:text-white"
            >
              <template v-if="typeof menu.label === 'string'">
                <div :class="{ 'font-bold': menu.label === activeApp?.title }">
                  {{ menu.label }}
                </div>
              </template>
              <component class="h-5" v-else :is="menu.label" />
            </button>
            <div
              v-if="submenuOpen"
              @pointerleave="
                () => {
                  submenuOpen = false
                }
              "
              class="absolute hidden group-hover:block top-8 left-0 bg-stone-200 z-50"
            >
              <button
                v-for="(submenu, iSub) in menu.items"
                :key="iSub"
                class="hover:bg-primary hover:text-white block text-nowrap w-full text-left px-2 disabled:opacity-50"
                :disabled="submenu.disabled"
                @click="
                  () => {
                    submenu.onClick()
                    submenuOpen = false
                  }
                "
              >
                {{ submenu.label }}
              </button>
            </div>
          </div>
          <div class="ml-auto tabular-nums">
            {{ clockNow }}
          </div>
        </div>
      </nav>

      <div
        id="desktop-container"
        style="background-size: cover; background-position: center; background-repeat: no-repeat"
        :style="{
          backgroundImage: `url('${selectedWallpaper}')`,
        }"
        class="w-full h-full overflow-hidden relative bg-stone-300"
        @click="
          () => {
            startMenuOpen = false
            submenuOpen = false
            clearIconSelection()
          }
        "
      >
        <!-- <audio src="/oh-my-pumpkin.webm" autoplay v-if="!booting && isLoggedIn"></audio> -->
        <!-- <AudioPlayer
          audio-src="/audio/bgm-loop.m4a"
          :autoplay="false"
          loop
          class="absolute right-0 bottom-0 min-w-[300px] bg-outset"
          v-if="!isShuttingDown && isLoggedIn"
        /> -->
        <div
          class="absolute p-6 h-fit max-h-full flex flex-col flex-wrap justify-start items-center right-0 gap-2 gap-y-6 max-w-200"
        >
          <TransitionGroup :css="false" @enter="makeIconAppear">
            <!-- Desktop icon container -->
            <DesktopIcon
              v-for="(app, i) in desktopIcons.filter(() => !booting && isLoggedIn)"
              :key="app.label"
              :label="app.label"
              :selected="app.selected"
              class="w-30 opacity-0"
              @click.stop="
                (e) => {
                  handleDesktopIconClick(e, i)
                }
              "
              @dblclick="(e) => openSelectedApps()"
            >
              <template #icon>
                <ClassicIcon :name="app.icon" class="w-12" />
              </template>
            </DesktopIcon>
          </TransitionGroup>
        </div>
        <DraggableWindow
          v-for="(app, i) in runningApps"
          :key="app.title"
          @maximize="() => handleWindowMaximize(i)"
          @restore="() => handleWindowRestore(i)"
          @minimize="() => handleWindowMinimize(i)"
          @focused="
            () => {
              activateWindow(i)
            }
          "
          @close="() => handleClose(i)"
          :min-height="app.minHeight"
          :min-width="app.minWidth"
          :maximized="app.maximized"
          :minimized="app.minimized"
          :window-active="app.active"
          :title="app.title"
        >
          <template #icon>
            <ClassicIcon :name="app.icon" class="w-6 inline-block"></ClassicIcon>
          </template>
          <iframe
            v-if="app.contentUrl"
            :src="app.contentUrl"
            class="w-full h-full"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </DraggableWindow>
        <div class="w-full flex justify-center absolute bottom-0 left-0 overflow-visible z-20">
          <div
            class="mx-auto flex flex-row gap-6 relative overflow-visible p-4 bg-stone-200/80 rounded-2xl mb-4"
          >
            <div
              v-for="(app, i) in apps"
              :key="app.appletUrl"
              class="flex flex-col w-15 h-15 overflow-visible justify-end items-center group gap-4"
            >
              <p
                class="text-center text-nowrap bg-stone-200 border border-stone-800 py-0.5 px-2 opacity-0 group-hover:opacity-100 shadow-classic"
              >
                {{ app.label }}
              </p>
              <button
                @click="
                  () => {
                    openApplet(i)
                  }
                "
              >
                <ClassicIcon :name="app.icon" class="w-15" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="startMenuOpen && false"
        id="start-menu"
        class="absolute bottom-12 left-2 border-4 w-[200px] max-h-3/4 border-gray-300 border-outset bg-gray-300 p-0 border-outset flex flex-col z-20"
      >
        <div
          class="flex flex-row gap-2 items-center p-2 bg-linear-to-r from-kana-blue to-kana-purple text-xl font-bold"
        >
          <img src="/profiles/kanaia.jpg" alt="Kanaia-profile" class="h-10 w-10" />
          <div>Kanaia Asa</div>
        </div>
        <div class="w-full grid grid-cols-1">
          <button
            v-for="(app, i) in apps"
            :key="i"
            class="flex flex-row items-center flex-nowrap hover:bg-blue-700 hover:text-white p-1 gap-2 select-none"
            @click="() => openApplet(i)"
          >
            <div class="shrink-0">
              <ClassicIcon :name="app.icon" class="w-8" />
            </div>
            <div>
              {{ app.label }}
            </div>
          </button>
        </div>
        <hr class="border-inset" />
        <div class="w-full grid grid-cols-1 mt-auto">
          <button
            class="flex flex-row items-baseline flex-nowrap hover:bg-blue-500 hover:text-white p-1 gap-2 select-none"
            @click="toggleFullscreen"
          >
            <div class="w-6 aspect-square">
              <span
                :class="{
                  'bi-fullscreen': !isFullscreen,
                  'bi-fullscreen-exit': isFullscreen,
                }"
              ></span>
            </div>
            <div>
              <span v-if="isFullscreen">Exit</span>
              Full Screen
            </div>
          </button>
          <button
            class="flex flex-row items-baseline flex-nowrap hover:bg-blue-500 hover:text-white p-1 gap-2 select-none"
            @click="restart"
          >
            <div>🔁</div>
            <div>Restart</div>
          </button>
          <button
            class="flex flex-row items-baseline flex-nowrap hover:bg-blue-500 hover:text-white p-1 gap-2 select-none"
            @click="shutdown"
          >
            <div>🟥</div>
            <div>Shutdown</div>
          </button>
        </div>
      </div>

      <div v-if="false" class="w-full border-t">
        <nav
          @click="
            () => {
              startMenuOpen = false
            }
          "
          class="w-screen p-1 bg-gray-300 border-t-2 border-outset flex flex-nowrap gap-2 shrink-0 shadow-lg"
        >
          <!-- This is the 'Taskbar' -->
          <ClassicButton
            @click.stop="
              () => {
                startMenuOpen = !startMenuOpen
              }
            "
            class="border-gray-400 shrink-0 flex flex-row items-center px-2 font-bold"
          >
            <ClassicIcon name="command" class="me-2 w-6" />
            Start
          </ClassicButton>

          <div class="flex flex-row flex-nowrap w-full grow-0 gap-2">
            <button
              v-for="(app, i) in runningApps"
              :key="i"
              @click="
                () => {
                  if (app.active) {
                    handleWindowMinimize(i)
                  } else {
                    activateWindow(i)
                  }
                }
              "
              class="border-2 px-1 max-w-[20em] border-gray-400 min-w-[10em] text-nowrap shrink truncate text-start flex flex-row flex-nowrap items-center gap-2"
              :class="{
                'bg-white font-bold border-inset': app.active,
                'border-outset': !app.active,
              }"
            >
              <ClassicIcon :name="app.icon" class="w-6" />
              {{ app.title }}
            </button>
          </div>

          <div class="border-2 shrink-0 border-gray-300 bg-gray-300 border-inset p-1 ms-auto">
            {{ clockNow }}
          </div>
        </nav>
      </div>
    </div>
  </div>
</template>
