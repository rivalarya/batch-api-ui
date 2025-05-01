import './assets/main.css'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ToastService from 'primevue/toastservice';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import App from './App.vue'
import Home from './views/Home.vue'
import CreateBatch from './views/CreateBatch.vue'
import CheckBatch from './views/CheckBatch.vue'
import Settings from './views/Settings.vue'
import JsonlGenerator from './views/JsonlGenerator.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/create', component: CreateBatch },
  { path: '/check', component: CheckBatch },
  { path: '/settings', component: Settings },
  { path: '/jsonl-generator', component: JsonlGenerator }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.use(ToastService)
app.use(PrimeVue, { theme: { preset: Aura } })
app.mount('#app')