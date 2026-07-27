<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="flex flex-col flex-nowrap gap-2 items-center shrink-0">
    <div class="aspect-square relative">
      <div
        class="absolute w-full h-full top-0 left-0 bg-primary opacity-50"
        v-if="props.selected"
      ></div>
      <slot name="icon"></slot>
    </div>
    <p
      class="text-center font-semibold text-white"
      :class="{
        'bg-transparent text-shadow-outline text-shadow-neutral-800 ': !props.selected,
        'bg-primary ': props.selected,
      }"
    >
      {{ props.label }}
    </p>
  </div>
</template>
