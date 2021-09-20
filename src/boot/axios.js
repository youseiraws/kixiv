import Vue from 'vue'
import axios from 'axios'

axios.defaults.baseURL = '/com'
axios.defaults.timeout = 30000
axios.interceptors.response.use(res => res.data)

axios.download = async url =>
  await axios.get(
    url.replace(`https://konachan.${axios.defaults.baseURL.slice(1)}`, ''),
    {
      responseType: 'blob',
      timeout: 300000,
    }
  )

Vue.prototype.$axios = axios
