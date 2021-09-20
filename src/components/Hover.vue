<template>
  <div @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <slot :hover="hover"></slot>
  </div>
</template>

<script>
export default {
  name: 'Hover',
  data() {
    return {
      hover: false,
    }
  },
  methods: {
    onMouseEnter() {
      this.hover = true
    },
    onMouseLeave() {
      this.hover = false
    },
  },
}
</script>
