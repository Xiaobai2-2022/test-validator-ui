<template>
    <div class="main-page">
        <h1>Test Validator</h1>
        <p class="version">Version 1.0.0</p>
        <el-button type="primary" @click="goToUserManager">Login or Register</el-button>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToUserManager = () => {
    router.push('/usermanager')
}
</script>

<style scoped>
.main-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
}

.version {
    margin: 10px 0 20px;
    font-size: 16px;
    color: #999;
}
</style>
