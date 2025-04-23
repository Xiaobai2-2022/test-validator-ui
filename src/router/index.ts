import { createRouter, createWebHistory } from 'vue-router'
import UserManager from '@/views/LoginRegister.vue'
import MainPage from '@/views/MainPage.vue'
import App from '@/views/AppPage.vue'
import { ElMessage } from "element-plus";

const routes = [
    { path: '/', component: MainPage },
    { path: '/usermanager', component: UserManager },
    { path: '/app', component: App },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('access_token')
    if (to.path === '/app') {
        if(!token) {
            ElMessage.error("Please Login or Register First")
            return next('/usermanager')
        }
        return next()
    } else if(to.path === '/usermanager') {
        if(token) {
            ElMessage.error("You are Already Logged in")
            return next('/app')
        }
        return next()
    } else if(to.path === '/') {
        return next()
    } else {
        ElMessage.error("Unauthorized Access")
        if(token) {
            return next('/app')
        } else {
            return next('/usermanager')
        }
    }
})

export default router
