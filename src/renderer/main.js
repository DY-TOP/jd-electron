import Vue from 'vue'

import App from './App'
import router from './router'
import store from './store'

/* element-ui start */
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
Vue.use(ElementUI)
/* element-ui end */

/* axios start */
import axios from 'axios'
var $axios = axios.create({
  baseURL: 'http://jd.backing.top/api/assignment/',
  timeout: 1000,
  headers: {'X-Custom-Header': 'xiaohanjdtask'}
});
Vue.http = Vue.prototype.$http = $axios
/* axios end */

/* dateformat start */
import moment from 'moment'
Vue.filter('utc2local', function (utcStr) {
  if (!utcStr) return ''
  utcStr = utcStr.toString()
  let localTime = moment.utc(utcStr).toDate()
  return moment(localTime).format('YYYY-MM-DD HH:mm:ss')
})
/* dateformat end */

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
