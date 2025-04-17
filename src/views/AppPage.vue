<template>
    <div class="app-page">
        <h1>Welcome to the Mock App Page</h1>
        <el-button type="danger" @click="logout">Logout</el-button>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from "axios";

const router = useRouter()

onMounted(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
        ElMessage.warning('Please login first.')
        router.push('/')
    }
})

const logout = async () => {
    try {
        // If you have a logout API endpoint (for server-side logout)
        await axios.post('/fxedu/api/auth/logout', {}, {
            withCredentials: true // Ensure cookies are cleared
        })
    } catch (err) {
        console.log(err)
    } finally {
        localStorage.removeItem('access_token')
        router.push('/')
    }
}

</script>

<style scoped>
.app-page {
    text-align: center;
    margin-top: 150px;
}
</style>
