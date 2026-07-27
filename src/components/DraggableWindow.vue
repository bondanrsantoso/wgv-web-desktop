<script setup>
import { computed, reactive, ref, watch } from 'vue'
// import ClassicButton from './ClassicButton.vue'
import { ChevronDown, ChevronsDownUpIcon, ChevronsUpDownIcon, MinusIcon, XIcon } from '@lucide/vue'

const props = defineProps({
  maximized: { type: Boolean, default: false },
  minimized: { type: Boolean, default: false },
  windowActive: { type: Boolean, default: false },
  title: { type: String, default: 'Untitled' },
  minWidth: { type: Number, default: 400 },
  minHeight: { type: Number, default: 200 },
  dialog: { type: Boolean, default: false },
})

const dragHandle = ref(null)
const windowFrame = ref(null)

const windowPos = reactive({
  x: Math.random() * (window.innerWidth / 3),
  y: Math.random() * (window.innerWidth / 4),
})

const initialMousePosition = reactive({
  x: 0,
  y: 0,
})

// For performance sake only update this when dragging
const currentMousePosition = reactive({
  x: 0,
  y: 0,
})

const moveOffset = computed(() => {
  return {
    x: currentMousePosition.x - initialMousePosition.x,
    y: currentMousePosition.y - initialMousePosition.y,
  }
})

const isDragging = ref(false)
const emits = defineEmits([
  'close',
  'maximize',
  'minimize',
  'restore',
  'dragStart',
  'dragEnd',
  'focused',
])

function handleDragStart(e) {
  initialMousePosition.x = e.screenX
  initialMousePosition.y = e.screenY
  currentMousePosition.x = e.screenX
  currentMousePosition.y = e.screenY

  isDragging.value = true
}

function handleDragWindow(e) {
  if (props.maximized) {
    return
  }
  currentMousePosition.x = e.screenX
  currentMousePosition.y = e.screenY
}

function handleDragEnd() {
  windowPos.x += moveOffset.value.x
  windowPos.y += moveOffset.value.y
  initialMousePosition.x = 0
  initialMousePosition.y = 0
  currentMousePosition.x = 0
  currentMousePosition.y = 0

  windowPos.x = Math.max(0, windowPos.x)
  windowPos.y = Math.max(0, windowPos.y)

  isDragging.value = false
}

watch(isDragging, (nowDragging) => {
  if (nowDragging) {
    emits('dragStart')
    window.addEventListener('mousemove', handleDragWindow)
    window.addEventListener('mouseup', handleDragEnd)
    window.addEventListener('mouseleave', handleDragEnd)
  } else {
    emits('dragEnd')
    window.removeEventListener('mousemove', handleDragWindow)
    window.removeEventListener('mouseup', handleDragEnd)
    window.removeEventListener('mouseleave', handleDragEnd)
  }
})

const isWindowHeldDown = ref(false)
</script>

<template>
  <div
    ref="windowFrame"
    :style="
      !props.maximized && !props.minimized
        ? {
            left: `${windowPos.x}px`,
            top: `${windowPos.y}px`,
            transformOrigin: '0 0',
            transform: isDragging ? `translate(${moveOffset.x}px, ${moveOffset.y}px)` : 'none',
            minWidth: `${props.minWidth}px`,
            minHeight: `${props.minHeight}px`,
            boxShadow: props.windowActive ? '10px 10px rgba(0,0,0,0.2)' : 'unset',
          }
        : null
    "
    @mousedown="
      () => {
        emits('focused')
        isWindowHeldDown = true
      }
    "
    @mouseup="
      () => {
        isWindowHeldDown = false
      }
    "
    @mouseenter="
      (e) => {
        if (e.buttons === 0 || !e.buttons) {
          isWindowHeldDown = false
        }
      }
    "
    class="window-outer-frame border border-neutral-800 flex flex-col overflow-auto w-0 h-0"
    :class="{
      'z-30': !props.minimized && props.windowActive,
      'w-full h-full relative': props.maximized,
      'absolute resize': !props.maximized,
      'z-0': !props.windowActive,
    }"
  >
    <div
      class="window-frame border-2 border-neutral-300 bg-neutral-200 p-0 w-full h-full flex flex-col"
    >
      <div
        class="w-full flex flex-row flex-nowrap p-1 text-sm shrink-0 relative h-9"
        :class="{
          'bg-neutral-300': props.windowActive,
          'bg-neutral-200': !props.windowActive,
        }"
      >
        <div
          class="mr-auto shrink-0 flex flex-row flex-nowrap gap-2 px-1 items-center z-10 group/wbtn pr-2"
          :class="{
            'saturate-0': !props.windowActive,
            'bg-neutral-300': props.windowActive,
          }"
        >
          <!-- Button container -->
          <button
            @click="
              () => {
                emits('close')
              }
            "
            class="rounded-full w-4 h-4 bg-red-500 overflow-hidden"
          >
            <XIcon class="w-full h-full opacity-0 group-hover/wbtn:opacity-100" />
          </button>
          <!-- <button
            @click="
              () => {
                emits('minimize')
              }
            "
            class="rounded-full w-4 h-4 bg-yellow-500 overflow-hidden"
          >
            <MinusIcon class="w-full h-full opacity-0 group-hover/wbtn:opacity-100" />
          </button> -->
          <button
            @click="
              () => {
                emits(props.maximized ? 'restore' : 'maximize')
              }
            "
            class="rounded-full w-4 h-4 bg-green-600 overflow-hidden rotate-45"
          >
            <ChevronsUpDownIcon
              v-if="!props.maximized"
              class="w-full h-full opacity-0 group-hover/wbtn:opacity-100"
            />
            <ChevronsDownUpIcon
              v-if="props.maximized"
              class="w-full h-full opacity-0 group-hover/wbtn:opacity-100"
            />
          </button>
        </div>
        <div
          v-if="props.windowActive"
          class="absolute w-full top-0 left-0 px-2 py-1 flex flex-col gap-px justify-center h-full"
        >
          <!-- The striped window frame decoration found in classic Macintosh/Apple systems -->
          <hr v-for="i in 5" :key="i" class="border border-outset border-neutral-100 w-full" />
        </div>
        <!-- Title bar -->
        <div
          @mousedown="handleDragStart"
          ref="dragHandle"
          class="top-0 left-0 shrink w-full text-ellipsis flex flex-row justify-center flex-nowrap gap-1 items-center absolute h-full"
        >
          <div
            class="flex flex-row items-center gap-1 px-1 py-1"
            :class="{
              'bg-neutral-300': props.windowActive,
              'bg-neutral-200': !props.windowActive,
            }"
          >
            <template v-if="$slots.icon">
              <slot name="icon"></slot>
            </template>
            <!-- Title Bar text here -->
            <p
              class="px-2 !select-none text-nowrap text-ellipsis"
              :class="{
                'font-bold': props.windowActive,
                'opacity-50': !props.windowActive,
              }"
            >
              {{ props.title }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="grow overflow-auto relative"
        :class="{
          'pointer-events-none': isDragging,
        }"
      >
        <!-- window content here -->
        <div
          v-if="isDragging || !props.windowActive || isWindowHeldDown"
          class="absolute z-50 w-full h-full top-0 left-0"
        >
          <!-- Content shield -->
          <!-- This here to prevent glitches when dragging window component -->
          <!-- Especially if it contains an iframe -->
        </div>
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
/*.window-frame {
  border-style: outset;
}*/
</style>
