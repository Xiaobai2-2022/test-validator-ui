<template>
    <div :class="`main-page ${roleColorClass}`" aria-label="Main Page">
        <div class="header-container">
            <el-page-header @back="() => {}">
                <template #breadcrumb>
                    <el-breadcrumb separator="/">
                        <el-breadcrumb-item :to="{ path: '/coursepage' }">Courses</el-breadcrumb-item>
                    </el-breadcrumb>
                </template>

                <template #content>
                    <div class="flex items-center">
                        <span class="text-large font-600">{{ displayName }}</span>
                        <el-tag :type="roleTagType" size="default" style="margin-left: 8px">
                            {{ roleLabel }}
                        </el-tag>
                    </div>
                </template>

                <template #extra>
                    <div class="flex items-center">
                        <el-button
                            v-if="canJoin"
                            class="mr-2"
                            @click="onJoinCourse"
                            type="info"
                        >
                            Join Course
                        </el-button>
                        <el-button
                            v-if="canCreate"
                            class="mr-2"
                            @click="onCreateCourse"
                            type="primary"
                        >
                            Create Course
                        </el-button>
                        <el-popconfirm
                            title="Are you sure you want to logout?"
                            confirm-button-text="Yes"
                            cancel-button-text="No"
                            @confirm="logout"
                        >
                            <template #reference>
                                <el-button type="danger">Logout</el-button>
                            </template>
                        </el-popconfirm>
                    </div>
                </template>
            </el-page-header>
        </div>

        <!-- Course Table -->
        <div class="course-table-container mt-4">
            <el-table :data="courses" style="width: 100%" border>
                <el-table-column prop="courseName" label="Course Name" min-width="180" />
                <el-table-column prop="courseDescription" label="Course Description" min-width="220" />
                <el-table-column prop="courseOwnerName" label="Course Instructor" min-width="160" />
                <el-table-column prop="courseJoinCode" label="Join Code" width="120" />
                <el-table-column label="Actions" width="240">
                    <template #default="scope">
                        <el-button size="small" type="primary" @click="enterCourse(scope.row)">Enter</el-button>
                        <el-button
                            v-if="canEdit"
                            size="small"
                            class="ml-2"
                            @click="editCourse(scope.row)"
                        >
                            Edit
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-pagination
                class="mt-4 text-center"
                background
                layout="prev, pager, next"
                :page-size="pageSize"
                :current-page="currentPage"
                :total="totalCourses"
                @current-change="handlePageChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const pageSize = 10
const currentPage = ref(1)
const totalCourses = ref(0)
const courses = ref([])

const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
const displayName = ref(storedUser.displayName)

let initialRole: 'student' | 'teacher' | 'assistant' | 'admin' = 'student'
switch (storedUser.userType) {
    case 0: initialRole = 'admin'; break
    case 1: initialRole = 'teacher'; break
    case 2: initialRole = 'assistant'; break
    case 3: initialRole = 'student'; break
}
const role = ref(initialRole)

const roleLabel = computed(() => role.value.charAt(0).toUpperCase() + role.value.slice(1))
const roleTagType = computed(() => {
    switch (role.value) {
        case 'student': return 'success'
        case 'teacher': return 'primary'
        case 'assistant': return 'warning'
        case 'admin': return 'danger'
        default: return ''
    }
})
const roleColorClass = computed(() => `role-${role.value}`)

const canCreate = computed(() => role.value === 'teacher' || role.value === 'admin')
const canJoin = computed(() => role.value === 'assistant' || role.value === 'student')
const canEdit = computed(() => role.value === 'teacher' || role.value === 'admin')

const fetchCourses = async (page = 1) => {
    try {
        const res = await axios.get('/fxedu/api/courses/page', {
            params: { page, size: pageSize },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('access_token')}`
            }
        })
        courses.value = res.data.records
        totalCourses.value = res.data.total
        currentPage.value = page
    } catch (err) {
        ElMessage.error('Failed to load courses')
    }
}

onMounted(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
        ElMessage.warning('Please login first.')
        router.push('/')
    } else {
        fetchCourses()
    }
})

const handlePageChange = (page: number) => {
    fetchCourses(page)
}

const enterCourse = (course: any) => {
    ElMessage.success(`Entering ${course.course_name}`)
    // router.push(`/courses/${course.id}`)
}

const editCourse = (course: any) => {
    ElMessage.info(`Editing ${course.course_name}`)
    // router.push(`/courses/${course.id}/edit`)
}

const onCreateCourse = () => {
    ElMessage.info('Redirect to create course page')
}

const onJoinCourse = () => {
    ElMessage.info('Redirect to join course page')
}

const logout = async () => {
    try {
        await axios.post('/fxedu/api/auth/logout', {}, { withCredentials: true })
    } catch (err) {
        console.log(err)
    } finally {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        router.push('/')
    }
}
</script>

<style scoped>
.main-page {
    display: flex;
    flex-direction: column;
    height: 100%;
}
.main-page.role-student {
    background-color: #f0f9eb;
}
.main-page.role-teacher {
    background-color: #ecf5ff;
}
.main-page.role-assistant {
    background-color: #fdf6ec;
}
.main-page.role-admin {
    background-color: #fde2e2;
}
.header-container {
    padding: 12px;
}
.course-table-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 12px 24px;
    overflow: hidden;
}
</style>
