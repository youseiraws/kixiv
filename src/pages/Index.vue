<template>
  <q-layout class="non-selectable" view="hHh Lpr lff">
    <q-header class="bg-white text-pink-11">
      <q-toolbar>
        <q-btn
          flat
          dense
          icon="eva-menu-outline"
          @click="onDrawerToggle"
        ></q-btn>
        <q-toolbar-title class="cursor-pointer">
          <span @click="onClickTitle">Kixiv</span>
          <div
            :style="{
              display: 'inline-block',
              'margin-left': drawer ? '230px' : '60px',
              transition: 'margin-left 0.3s',
            }"
          >
            <q-chip
              v-for="tag in postKeywords.tags"
              :key="tag.name"
              dense
              square
              size="lg"
              class="no-shadow"
              :style="{ 'background-color': getTagColor(tag.type) }"
              text-color="white"
            >
              {{ tag.name }}
              <q-badge
                v-show="!$_.isUndefined(tagCountMap[tag.name])"
                class="q-ml-sm q-mt-xs"
                rounded
                :style="{
                  'background-color': 'white',
                  color: getTagColor(tag.type),
                }"
              >
                {{ tagCountMap[tag.name] }}
              </q-badge>
            </q-chip>
          </div>
        </q-toolbar-title>
        <q-badge
          v-show="postCount"
          class="q-mr-sm q-mt-xs"
          rounded
          color="primary"
          text-color="white"
        >
          {{ postCount }}
        </q-badge>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer">
      <q-list class="row justify-center q-mt-lg">
        <q-item-label class="full-width text-pink-11" header>标签</q-item-label>
        <q-item>
          <q-select
            v-model="postKeywords.tags"
            outlined
            dense
            use-input
            use-chips
            multiple
            options-dense
            input-debounce="0"
            hide-dropdown-icon
            :options="tagOptions"
            @filter="onFilterTags"
            popup-content-class="no-shadow"
            popup-content-style="border: 1px solid rgba(0, 0, 0, 0.12)"
          >
            <template v-slot:append>
              <q-icon
                class="cursor-pointer"
                name="eva-pricetags-outline"
                color="primary"
                @click="() => (tagDialog = true)"
              >
              </q-icon>
            </template>
            <template v-slot:option="{ itemProps, itemEvents, opt }">
              <q-item v-bind="itemProps" v-on="itemEvents">
                <q-item-section :style="{ color: getTagColor(opt.type) }">
                  {{ opt.name }}
                </q-item-section>
              </q-item>
              <q-separator />
            </template>
            <template
              v-slot:selected-item="{ index, removeAtIndex, tabindex, opt }"
            >
              <q-chip
                removable
                dense
                square
                @remove="removeAtIndex(index)"
                :tabindex="tabindex"
                :style="{ 'background-color': getTagColor(opt.type) }"
                text-color="white"
              >
                {{ opt.name }}
              </q-chip>
            </template>
          </q-select>
        </q-item>
        <q-item-label class="full-width text-pink-11" header>排序</q-item-label>
        <q-item>
          <q-btn-toggle
            v-model="postKeywords.sort"
            :options="sortOptions"
            outline
          >
          </q-btn-toggle>
        </q-item>
        <q-item-label class="full-width text-pink-11" header>分级</q-item-label>
        <q-item>
          <q-btn-group outline>
            <q-btn
              outline
              v-for="rating in ratingOptions"
              :key="rating.value"
              :label="rating.label"
              @click="setRating(rating.value)"
              :color="getRatingColor(rating.value)"
            />
          </q-btn-group>
        </q-item>
        <q-item-label class="full-width text-pink-11" header>日期</q-item-label>
        <q-item>
          <q-input :value="dateRangeText" outlined dense readonly>
            <template v-slot:append>
              <q-icon
                class="cursor-pointer"
                name="eva-calendar-outline"
                color="primary"
              >
                <q-popup-proxy
                  ref="dateProxy"
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-date
                    v-model="postKeywords.dateRange"
                    @input="onDateInput"
                    minimal
                    range
                    mask="YYYY-MM-DD"
                    :options="dateOptions"
                    :locale="dateLocale"
                  >
                  </q-date
                ></q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-item>
        <q-btn
          class="fixed-bottom-right q-ma-md"
          flat
          icon="eva-settings-outline"
          color="primary"
          dense
        ></q-btn>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page class="row justify-center items-start q-ma-md">
        <q-infinite-scroll
          ref="infiniteScrollPost"
          :class="drawer ? 'col-12' : 'col-10'"
          :offset="250"
          class="row q-col-gutter-sm"
          @load="onLoadPost"
        >
          <div v-for="post in postState.posts" :key="post.id" class="col-3">
            <post
              :post="post"
              :downloadLoading="downloadLoadings[post.id]"
              @click="onClickPost(post)"
              @download="onClickDownload(post)"
            ></post>
          </div>
          <template #loading>
            <random-loading
              size="lg"
              :loading="postLoading"
              class="fixed-top-right q-ma-xl"
            ></random-loading>
          </template>
        </q-infinite-scroll>

        <q-page-scroller
          :offset="[18, 18]"
          :scroll-offset="150"
          position="bottom-right"
        >
          <q-btn
            icon="eva-chevron-up-outline"
            flat
            round
            size="lg"
            color="primary"
          ></q-btn>
        </q-page-scroller>
      </q-page>
    </q-page-container>

    <q-dialog v-model="tagDialog">
      <q-card class="tag-dialog">
        <q-card-section class="row items-center q-pb-sm">
          <q-select
            v-model="tagKeywords.type"
            outlined
            dense
            options-dense
            emit-value
            map-options
            dropdown-icon="eva-chevron-down-outline"
            :options="tagTypeOptions"
            class="text-uppercase"
            popup-content-class="no-shadow text-uppercase"
            popup-content-style="border: 1px solid rgba(0, 0, 0, 0.12)"
          >
            <template v-slot:option="{ itemProps, itemEvents, opt }">
              <q-item v-bind="itemProps" v-on="itemEvents">
                <q-item-section :style="{ color: opt.color }">
                  {{ opt.name }}
                </q-item-section>
              </q-item>
              <q-separator />
            </template>
            <template v-slot:selected-item="{ opt }">
              <span :style="{ color: opt.color }">
                {{ opt.name }}
              </span>
            </template>
          </q-select>
          <q-space />
          <q-select
            v-model="tagKeywords.tag"
            outlined
            dense
            use-input
            fill-input
            options-dense
            input-debounce="500"
            hide-dropdown-icon
            hide-selected
            emit-value
            map-options
            option-value="name"
            option-label="name"
            :options="recentTagOptions"
            @input-value="setKeywordsTag"
            @filter="onFilterRecentTags"
            popup-content-class="no-shadow"
            popup-content-style="border: 1px solid rgba(0, 0, 0, 0.12)"
          >
            <template v-slot:option="{ itemProps, itemEvents, opt }">
              <q-item v-bind="itemProps" v-on="itemEvents">
                <q-item-section :style="{ color: getTagColor(opt.type) }">
                  {{ opt.name }}
                </q-item-section>
              </q-item>
              <q-separator />
            </template>
          </q-select>
        </q-card-section>

        <q-card-section class="scroll q-py-none tag-infinite-scroll">
          <q-infinite-scroll
            ref="infiniteScrollTag"
            :offset="250"
            @load="onLoadTag"
          >
            <q-chip
              v-for="tag in tagState.tags"
              :key="tag.name"
              dense
              square
              clickable
              :outline="!hasTagSelected(tag)"
              class="no-shadow"
              :style="tagStyle(tag)"
              @click="setTag(tag)"
            >
              {{ tag.name }}
            </q-chip>
            <template #loading>
              <random-loading
                size="sm"
                :loading="tagLoading"
                class="float-right"
              ></random-loading>
            </template>
          </q-infinite-scroll>
        </q-card-section>
        <q-card-section class="row items-center q-pt-sm">
          <q-chip
            v-for="tag in selectedTags"
            :key="tag.name"
            dense
            square
            removable
            :style="tagStyle(tag)"
            @remove="setTag(tag)"
            >{{ tag.name }}
          </q-chip>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="carouselDialog"
      maximized
      @keyup.space="onClickSlide"
      @keyup.enter="onFullScreenToggle"
      @keyup.arrow-left="onLeftArrow"
      @keyup.arrow-right="onRightArrow"
      @keyup.a="onLeftArrow"
      @keyup.d="onRightArrow"
    >
      <q-carousel
        animated
        v-model="slide"
        ref="carousel"
        :autoplay="autoplay"
        @mousemove="setAutoplay"
        @transition="onTransition"
      >
        <q-carousel-slide
          :name="post"
          class="q-pa-none"
          v-for="post in postState.posts"
          :key="post.id"
          @click="onClickSlide"
        >
          <q-img
            class="full-height full-width"
            :contain="true"
            :placeholder-src="post.sample_url"
            :src="post.file_url"
            no-default-spinner
          />
        </q-carousel-slide>
        <template v-slot:control>
          <q-carousel-control position="left" class="row items-center">
            <hover #default="{hover}">
              <q-btn
                outline
                round
                dense
                :text-color="hover ? 'primary' : 'transparent'"
                icon="eva-chevron-left-outline"
                @click="onLeftArrow"
              />
            </hover>
          </q-carousel-control>
          <q-carousel-control position="top-left">
            <hover #default="{hover}">
              <q-btn
                outline
                round
                dense
                :text-color="hover ? 'primary' : 'transparent'"
                :icon="autoplayLock ? 'eva-lock-outline' : 'eva-unlock-outline'"
                @click="() => (autoplayLock = !autoplayLock)"
              />
            </hover>
          </q-carousel-control>
          <q-carousel-control position="bottom-left">
            <hover #default="{hover}">
              <q-btn
                outline
                round
                dense
                :text-color="hover ? 'primary' : 'transparent'"
                icon="eva-download-outline"
                :loading="downloadLoadings[slide.id]"
                @click="onClickDownload(slide)"
              />
            </hover>
          </q-carousel-control>
          <q-carousel-control position="right" class="row items-center">
            <hover #default="{hover}">
              <q-btn
                outline
                round
                dense
                :text-color="hover ? 'primary' : 'transparent'"
                icon="eva-chevron-right-outline"
                @click="onRightArrow"
              />
            </hover>
          </q-carousel-control>
          <q-carousel-control position="top-right">
            <hover #default="{hover}">
              <q-btn
                class="q-mb-md q-ml-md"
                outline
                round
                dense
                :text-color="hover ? 'primary' : 'transparent'"
                icon="eva-info-outline"
              />

              <q-card
                v-show="hover"
                class="fixed-top-right q-mr-xl q-mt-xl no-shadow tag-card"
                transition-show="scale"
                transition-hide="scale"
              >
                <q-scroll-area
                  class="q-pa-xs tag-scroll-area"
                  :thumb-style="{ width: 0, opacity: 0 }"
                >
                  <hover
                    class="slide-hover"
                    #default="{hover}"
                    v-for="tag in slideTags"
                    :key="tag.name"
                  >
                    <q-chip
                      dense
                      square
                      :outline="!hover"
                      clickable
                      class="no-shadow"
                      :style="slideTagStyle(hover, tag)"
                      @click="onClickTag(tag)"
                    >
                      {{ tag.name }}
                    </q-chip>
                  </hover>
                </q-scroll-area>
              </q-card>
            </hover>
          </q-carousel-control>
          <q-carousel-control position="bottom-right">
            <hover #default="{hover}">
              <q-btn
                outline
                round
                dense
                :text-color="hover ? 'primary' : 'transparent'"
                :icon="
                  $q.fullscreen.isActive
                    ? 'eva-collapse-outline'
                    : 'eva-expand-outline'
                "
                @click="onFullScreenToggle"
              />
            </hover>
          </q-carousel-control>
        </template>
      </q-carousel>
    </q-dialog>
  </q-layout>
</template>

<script>
import cheerio from 'cheerio'
import { saveAs } from 'file-saver'
import { throttle, date } from 'quasar'

import RandomLoading from 'components/RandomLoading'
import Post from 'components/Post'
import Hover from 'components/Hover'
import {
  tag_types,
  complete_tag,
  set_tag_data,
  get_tag_color,
  get_tag_value,
} from 'utils/tag'

const DATE_PATTERN1 = 'YYYY-MM-DD'
const DATE_PATTERN2 = 'YYYY/MM/DD'
const START_DATE = '2008/01/13'
const POST_LIMIT = 21
const END_OF_DATE_RANGE = 'END'
const CAROUSEL_INTERVAL = 10000

export default {
  name: 'Index',
  components: { RandomLoading, Post, Hover },
  data() {
    return {
      drawer: false,
      menu: false,
      source: {},
      tagDialog: false,
      carouselDialog: false,
      slide: {},
      slideTags: [],
      autoplay: false,
      autoplayLock: false,
      setAutoplay: null,
      autoplayTimer: 0,
      downloadLoadings: {},

      localTags: [],
      exclusiveTags: [],
      recentTags: [],
      postCount: 0,
      tagCountMap: {},

      sortOptions: [
        {
          label: '最新',
          value: '',
        },
        {
          label: '随机',
          value: 'order:random',
        },
        {
          label: '评分',
          value: 'order:score',
        },
      ],
      ratingOptions: [
        {
          label: 'Safe',
          value: 's',
        },
        {
          label: 'Questionable',
          value: 'q',
        },
        {
          label: 'Explicit',
          value: 'e',
        },
      ],
      tagTypeOptions: tag_types,
      tagOptions: [],
      recentTagOptions: [],
      dateLocale: {
        days: ['日', '一', '二', '三', '四', '五', '六'],
        daysShort: ['日', '一', '二', '三', '四', '五', '六'],
        months: [
          '1月',
          '2月',
          '3月',
          '4月',
          '5月',
          '6月',
          '7月',
          '8月',
          '9月',
          '10月',
          '11月',
          '12月',
        ],
        monthsShort: [
          '1月',
          '2月',
          '3月',
          '4月',
          '5月',
          '6月',
          '7月',
          '8月',
          '9月',
          '10月',
          '11月',
          '12月',
        ],
      },

      tagLoading: false,
      tagKeywords: {
        tag: '',
        type: '',
      },
      tagState: {
        page: 1,
        tags: [],
        done: false,
      },
      selectedTags: [],

      postLoading: false,
      postKeywords: {
        sort: '',
        ratings: ['s', 'q', 'e'],
        dateRange: '',
        tags: [],
      },
      postState: {
        currentDate: '',
        page: 1,
        posts: [],
        done: false,
      },
    }
  },
  computed: {
    dateRangeText() {
      const dateRange = this.postKeywords.dateRange
      if (dateRange) {
        return typeof dateRange === 'string'
          ? dateRange
          : `${dateRange.from}/${dateRange.to}`
      }
      return ''
    },
    fromDate() {
      const dateRange = this.postKeywords.dateRange
      if (dateRange) {
        return typeof dateRange === 'string' ? dateRange : dateRange.from
      }
      return ''
    },
  },
  watch: {
    tagKeywords: {
      handler(newTagKeywords) {
        this.resetTag(newTagKeywords)
        this.$refs.infiniteScrollTag.poll()
      },
      deep: true,
    },
    postKeywords: {
      async handler() {
        this.refreshPost()
        this.postCount = 0
        const tags = this.getTagStr()
        const $first = cheerio.load(
          await this.$axios.get('/post', {
            params: {
              tags,
              page: 1,
            },
          })
        )
        const page = $first('.next_page')
          .prev()
          .text()
        if (page) {
          const $last = cheerio.load(
            await this.$axios.get('/post', {
              params: {
                tags,
                page,
              },
            })
          )
          this.postCount =
            (page - 1) * POST_LIMIT +
            $last('#post-list-posts').children().length
        } else {
          this.postCount = $first('#post-list-posts').children().length
        }
      },
      deep: true,
      immediate: true,
    },
    'postKeywords.tags'(newTags, oldTags) {
      const differentTags = this.$_.differenceBy(newTags, oldTags, 'name')
      if (differentTags.length > 0) {
        differentTags.forEach(async differentTag => {
          const { name, count } = differentTag
          const existedTag = this.recentTags.find(
            recentTag => recentTag.name === name
          )
          if (existedTag) {
            existedTag.record++
          } else {
            this.recentTags.push({ ...differentTag, record: 1 })
          }
          this.tagCountMap = {
            ...this.tagCountMap,
            [name]: count || (await this.getTagInfo(name)).count,
          }
        })
        this.$q.localStorage.set('recent_tags', this.recentTags)
      }
    },
    tagDialog(newTagDialog) {
      if (newTagDialog) {
        this.selectedTags = []
      } else {
        const newTags = this.$_.differenceBy(
          this.selectedTags,
          this.postKeywords.tags,
          'name'
        )
        if (newTags.length > 0) {
          this.postKeywords.tags = [...this.postKeywords.tags, ...newTags]
        }
      }
    },
    async slide(newSlide) {
      this.slideTags = []
      if (newSlide.tags) {
        const tags = newSlide.tags.split(' ')
        this.slideTags = await Promise.all(
          tags.map(async name => {
            let tag = complete_tag(name, 10).find(tag => tag.name === name)
            if (tag) {
              return tag
            }
            tag = this.exclusiveTags.find(tag => tag.name === name)
            if (tag) {
              return tag
            }
            try {
              tag = (
                await this.fetchTag({ name: `${name}*`, order: 'name' })
              )[0]
              this.storeExclusiveTags(tag)
              return tag
            } catch {
              return { name, type: '' }
            }
          })
        )
      }
    },
  },
  async created() {
    const _this = this
    set_tag_data(await this.getSummary())
    this.getLocalTags()
    this.getExclusiveTags()
    this.getRecentTags()
    this.resetTag()
    this.setAutoplay = throttle(() => {
      _this.autoplay = false
      clearTimeout(_this.autoplayTimer)
      if (_this.autoplayLock) {
        return
      }
      _this.autoplayTimer = setTimeout(() => {
        _this.autoplay = CAROUSEL_INTERVAL
      })
    }, 300)
  },
  methods: {
    async getSummary() {
      const localSummary = this.$q.localStorage.getItem('summary')
      if (localSummary) {
        return localSummary
      } else {
        const remoteSummary = await this.fetchSummary()
        this.$q.localStorage.set('summary', remoteSummary.data)
        return remoteSummary.data
      }
    },
    getLocalTags() {
      const localTags = this.$q.localStorage.getItem('local_tags')
      if (localTags) {
        this.localTags = localTags
      }
    },
    getExclusiveTags() {
      const exclusiveTags = this.$q.localStorage.getItem('exclusive_tags')
      if (exclusiveTags) {
        this.exclusiveTags = exclusiveTags
      }
    },
    getRecentTags() {
      const recentTags = this.$q.localStorage.getItem('recent_tags')
      if (recentTags) {
        this.recentTags = recentTags
      }
    },
    storeLocalTags({ type, tags, page }, newTags) {
      this.localTags = {
        ...this.localTags,
        [type]: {
          page: ++page,
          tags: this.$_.uniqBy([...tags, ...newTags], 'id'),
        },
      }
      this.$q.localStorage.set('local_tags', this.localTags)
    },
    storeExclusiveTags(tag) {
      this.exclusiveTags.push(tag)
      this.$q.localStorage.set('exclusive_tags', this.exclusiveTags)
    },
    resetTag(tagKeywords = this.tagKeywords) {
      const localTag = this.localTags[tagKeywords.type]
      if (!tagKeywords.tag && localTag) {
        this.tagState = {
          page: localTag.page,
          tags: localTag.tags,
          done: false,
        }
      } else {
        this.tagState = {
          page: 1,
          tags: [],
          done: false,
        }
      }
    },
    resetPost() {
      this.postState = {
        currentDate: this.fromDate,
        page: 1,
        posts: [],
        done: false,
      }
    },
    refreshPost() {
      if (this.source.cancel) {
        this.resetPost()
        this.source.cancel()
        this.$refs.infiniteScrollPost.poll()
      }
    },
    getTagColor(type) {
      return get_tag_color(type)
    },
    async getTagInfo(name) {
      let tag = Object.keys(this.localTags)
        .reduce((lKey, rKey) => [...lKey, ...this.localTags[rKey].tags], [])
        .find(tag => tag.name === name)
      if (tag) {
        return tag
      }
      tag = this.exclusiveTags.find(tag => tag.name === name)
      if (tag) {
        return tag
      }
      try {
        return (await this.fetchTag({ name: `${name}*`, order: 'name' }))[0]
      } catch {
        return {
          id: 0,
          name: '',
          type: '',
          count: 0,
        }
      }
    },
    setTag(tag) {
      const index = this.selectedTags.findIndex(({ name }) => name === tag.name)
      if (index === -1) {
        this.selectedTags.push(tag)
      } else {
        this.selectedTags.splice(index, 1)
      }
    },
    hasTagSelected(tag) {
      return !!this.selectedTags.find(
        selectedTag => selectedTag.name === tag.name
      )
    },
    tagStyle(tag) {
      return {
        border: '1px solid',
        color: this.hasTagSelected(tag) ? 'white' : this.getTagColor(tag.type),
        'background-color': this.hasTagSelected(tag)
          ? this.getTagColor(tag.type)
          : 'white',
      }
    },
    slideTagStyle(hover, { type }) {
      return {
        border: `1px solid ${this.getTagColor(type)}`,
        color: hover ? 'white' : this.getTagColor(type),
        'background-color': hover ? this.getTagColor(type) : 'white',
      }
    },
    setRating(rating) {
      const index = this.postKeywords.ratings.indexOf(rating)
      if (index === -1) {
        this.postKeywords.ratings.push(rating)
      } else {
        if (this.postKeywords.ratings.length !== 1) {
          this.postKeywords.ratings.splice(index, 1)
        }
      }
    },
    getRatingColor(rating) {
      return this.postKeywords.ratings.includes(rating) ? 'primary' : 'black'
    },
    nextDate() {
      const dateRange = this.postKeywords.dateRange
      const currentDate = this.postState.currentDate
      if (dateRange) {
        if (typeof dateRange === 'string') {
          return currentDate !== dateRange ? dateRange : END_OF_DATE_RANGE
        } else {
          if (currentDate) {
            if (currentDate !== dateRange.to) {
              return date.formatDate(
                date.addToDate(date.extractDate(currentDate, DATE_PATTERN1), {
                  days: 1,
                }),
                DATE_PATTERN1
              )
            } else {
              return END_OF_DATE_RANGE
            }
          } else {
            return dateRange.from
          }
        }
      }
      return ''
    },
    dateOptions(dateOption) {
      return (
        dateOption >= START_DATE &&
        dateOption <= date.formatDate(Date.now(), DATE_PATTERN2)
      )
    },
    setKeywordsTag(val) {
      this.tagKeywords.tag = val
    },
    getTagStr() {
      const { tags: rawTags, sort, ratings, dateRange } = this.postKeywords
      const tags = [...rawTags.map(tag => tag.name)]
      if (sort) {
        tags.push(sort)
      }
      if (ratings.length === 1) {
        tags.push(`rating:${ratings[0]}`)
      } else if (ratings.length === 2) {
        tags.push(
          `-rating:${
            this.$_.difference(
              this.ratingOptions.map(rating => rating.value),
              ratings
            )[0]
          }`
        )
      }
      if (dateRange) {
        tags.push(`date:${this.postState.currentDate}`)
      }
      return tags.join(' ')
    },
    async getTag() {
      if (this.tagKeywords.tag) {
        this.tagState.tags = complete_tag(this.tagKeywords.tag).filter(tag =>
          ['', tag.type].includes(this.tagKeywords.type)
        )
        this.tagState.done = true
      } else {
        const oldTagState = this.$_.cloneDeep({
          type: this.tagKeywords.type,
          tags: this.tagState.tags,
          page: this.tagState.page,
        })
        const tags = await this.fetchTag({
          type: this.tagKeywords.type,
          page: this.tagState.page,
        })
        if (tags.length === 0) {
          this.tagState.done = true
        } else {
          if (oldTagState.type === this.tagKeywords.type) {
            this.tagState.tags = this.$_.uniqBy(
              [...this.tagState.tags, ...tags],
              'id'
            )
            this.tagState.page++
          }
          this.storeLocalTags(oldTagState, tags)
        }
      }
    },
    async getPost() {
      const posts = await this.fetchPost({
        tags: this.getTagStr(),
        page: this.postState.page,
      })
      if (posts.length < POST_LIMIT) {
        if (this.postState.currentDate) {
          const nextDate = this.nextDate()
          if (nextDate !== END_OF_DATE_RANGE) {
            this.postState.currentDate = nextDate
            this.postState.page = 1
          } else {
            this.postState.done = true
          }
        } else {
          this.postState.done = true
        }
      } else {
        this.postState.page++
      }
      this.postState.posts.push(...posts)
    },

    async onLoadTag(index, done) {
      if (this.tagState.done) {
        done()
        return
      }
      this.tagLoading = true
      try {
        await this.getTag()
        this.tagLoading = false
        done()
      } catch {
        this.tagLoading = false
        done()
      }
    },
    async onLoadPost(index, done = () => {}) {
      if (this.postState.done) {
        done()
        return
      }
      this.postLoading = true
      try {
        await this.getPost()
        this.postLoading = false
        done()
      } catch {
        this.postLoading = false
        done()
      }
    },
    onDateInput() {
      this.$refs.dateProxy.hide()
    },
    onFilterTags(val, update) {
      update(() => {
        if (val === '') {
          this.tagOptions = []
        } else {
          this.tagOptions = complete_tag(val, 10)
        }
      })
    },
    onFilterRecentTags(val, update) {
      update(() => {
        let tags
        if (this.$_.isEmpty(this.tagKeywords.tag)) {
          tags = this.recentTags
        } else {
          tags = this.recentTags.filter(tag =>
            tag.name.includes(this.tagKeywords.tag)
          )
        }
        this.recentTagOptions = tags
          .sort((lTag, rTag) => rTag.record - lTag.record)
          .slice(0, 10)
      })
    },
    onClickPost(post) {
      this.slide = post
      this.carouselDialog = true
    },
    onClickSlide() {
      this.slide = {}
      this.carouselDialog = false
      this.$q.fullscreen.exit()
    },
    async onTransition(newPost) {
      const index = this.postState.posts.findIndex(
        ({ id }) => id === newPost.id
      )
      if (this.postState.posts.length - 10 < index) {
        if (this.postState.done) {
          return
        }
        if (!this.postLoading) {
          await this.onLoadPost()
        }
      }
    },
    onLeftArrow() {
      this.$refs.carousel.previous()
    },
    onRightArrow() {
      this.$refs.carousel.next()
    },
    onDrawerToggle() {
      this.drawer = !this.drawer
    },
    onFullScreenToggle() {
      this.$q.fullscreen.toggle()
    },
    onClickTag(tag) {
      this.onClickSlide()
      this.postKeywords.tags = [tag]
    },
    async onClickDownload({ id, file_url }) {
      this.downloadLoadings = { ...this.downloadLoadings, [id]: true }
      let blob
      try {
        blob = await this.$axios.download(file_url)
        this.downloadLoadings = { ...this.downloadLoadings, [id]: false }
        saveAs(blob, file_url.split('/').reverse()[0])
      } catch {
        this.downloadLoadings = { ...this.downloadLoadings, [id]: false }
      }
    },
    onClickTitle() {
      this.refreshPost()
    },

    async fetchSummary() {
      return await this.$axios.get('/tag/summary.json')
    },
    async fetchTag({ name = '', type = '', page = 1, order = 'count' }) {
      const res = await this.$axios.get('/tag', {
        params: {
          name,
          type,
          page,
          order,
        },
      })
      const $ = cheerio.load(res)
      return $('table.highlightable>tbody>tr')
        .map((i, el) => {
          const tds = $(el).children('td')
          return {
            id: parseInt(
              tds
                .eq(3)
                .children()
                .eq(0)
                .attr('href')
                .split('/')
                .reverse()[0]
            ),
            name: tds
              .eq(1)
              .children()
              .eq(1)
              .text(),
            count: parseInt(tds.eq(0).text()),
            type: get_tag_value(
              tds
                .eq(2)
                .text()
                .split(',')[0]
            ),
          }
        })
        .get()
    },
    async fetchPost({ tags = [], page = 1 }) {
      this.source = this.$axios.CancelToken.source()
      return await this.$axios.get('/post.json', {
        cancelToken: this.source.token,
        params: {
          tags,
          page,
        },
      })
    },
  },
}
</script>

<style scoped>
.tag-dialog {
  width: 50vw;
  max-width: 50vw;
}

.tag-infinite-scroll {
  height: 38vh;
  max-height: 38vh;
}

.tag-card {
  border: 1px solid #ff80ab;
  background-color: rgba(255, 255, 255, 0.3);
}

.tag-scroll-area {
  height: 24vh;
  width: 12vw;
}

.slide-hover {
  display: inline-block;
}
</style>
