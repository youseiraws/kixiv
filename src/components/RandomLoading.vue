<template>
  <component :color="color" :is="spinner" :size="size"></component>
</template>

<script>
export default {
  name: 'RandomLoading',
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: 'md',
    },
  },
  data() {
    return {
      spinner: '',
      color: '',
      spinners: [
        'q-spinner',
        'q-spinner-audio',
        'q-spinner-ball',
        'q-spinner-bars',
        'q-spinner-cube',
        'q-spinner-dots',
        'q-spinner-facebook',
        'q-spinner-gears',
        'q-spinner-grid',
        'q-spinner-hearts',
        'q-spinner-hourglass',
        'q-spinner-infinity',
        'q-spinner-ios',
        'q-spinner-oval',
        'q-spinner-pie',
        'q-spinner-puff',
        'q-spinner-rings',
        'q-spinner-tail',
      ],
      colors: [
        'red',
        'pink',
        'purple',
        'deep-purple',
        'indigo',
        'blue',
        'light-blue',
        'cyan',
        'teal',
        'green',
        'light-green',
        'lime',
        'yellow',
        'amber',
        'orange',
        'deep-orange',
        'brown',
        'grey',
        'blue-grey',
      ],
      depth: ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
    }
  },
  watch: {
    loading(newLoading) {
      if (newLoading) {
        this.spinner = this.spinners[this.$_.random(this.spinners.length - 1)]
        this.color = `${this.colors[this.$_.random(this.colors.length - 1)]}-${
          this.depth[this.$_.random(this.depth.length - 1)]
        }`
      }
    },
  },
}
</script>
