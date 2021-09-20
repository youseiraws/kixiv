<template>
  <hover #default="{hover}">
    <q-card :flat="!hover">
      <q-img
        :ratio="16 / 9"
        :contain="false"
        :src="sampleUrl"
        :placeholder-src="post.preview_url"
        no-default-spinner
        @click="$emit('click')"
      />
      <q-btn-group
        v-show="hover"
        class="absolute-bottom row justify-end q-pa-xs"
      >
        <q-btn
          class="col-2"
          flat
          icon="eva-download-outline"
          color="primary"
          dense
          :loading="downloadLoading"
          @click="$emit('download')"
        ></q-btn>
        <q-btn
          class="col-2"
          flat
          icon="eva-sync-outline"
          color="primary"
          dense
          @click="onClickSync"
        ></q-btn>
        <q-btn
          class="col-2"
          flat
          icon="eva-star-outline"
          color="primary"
          dense
        ></q-btn>
      </q-btn-group>
    </q-card>
  </hover>
</template>

<script>
import Hover from './Hover'

export default {
  name: 'Post',
  components: {
    Hover,
  },
  props: {
    post: {
      type: Object,
      default() {
        return {}
      },
    },
    downloadLoading: {
      type: Boolean,
      default() {
        return false
      },
    },
  },
  data() {
    return {
      sampleUrl: this.post.sample_url,
    }
  },
  methods: {
    onClickSync() {
      this.sampleUrl = `${this.post.sample_url}?t=${Date.now()}`
    },
  },
}
</script>
