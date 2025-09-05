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

        <div class="course-table-container mt-4">
            <el-table :data="courses" style="width: 100%" border>
                <el-table-column prop="courseName" label="Course Name" min-width="180" />
                <el-table-column prop="courseDescription" label="Course Description" min-width="220" />
                <el-table-column prop="courseOwnerName" label="Course Instructor" min-width="160" />
                <el-table-column prop="courseJoinCode" label="Join Code" width="120" />

                <el-table-column label="Active" width="100">
                    <template #default="scope">
                        <el-tag :type="scope.row.isActive ? 'success' : 'info'">
                            {{ scope.row.isActive ? 'Yes' : 'No' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="Open" width="100">
                    <template #default="scope">
                        <el-tag :type="scope.row.isOpen ? 'success' : 'danger'">
                            {{ scope.row.isOpen ? 'Open' : 'Closed' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="Actions" width="260">
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

        <el-dialog
            v-model="createDialogVisible"
            title="Create New Course"
            width="520px"
        >
            <el-form
                :model="createForm"
                :rules="createRules"
                ref="createFormRef"
                label-width="130px"
                status-icon
            >
                <el-form-item label="Course Name" prop="courseName">
                    <el-input v-model="createForm.courseName" maxlength="64" show-word-limit />
                </el-form-item>

                <el-form-item label="Description" prop="courseDescription">
                    <el-input
                        v-model="createForm.courseDescription"
                        type="textarea"
                        :rows="3"
                        maxlength="512"
                        show-word-limit
                    />
                </el-form-item>

                <!-- NEW: switches for Active/Open -->
                <el-form-item label="Active Course">
                    <el-switch v-model="createForm.isActive" />
                </el-form-item>
                <el-form-item label="Open to Join">
                    <el-switch v-model="createForm.isOpen" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="createDialogVisible = false">Cancel</el-button>
                <el-button type="primary" :loading="creating" @click="submitCreateCourse">
                    Create
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuth } from '@/composables/useAuth.ts'
import type { CourseCreateDTO } from '@/models/course.ts'

const { tryRefreshToken, getAuthHeaders } = useAuth()
const router = useRouter()

const pageSize = 10
const currentPage = ref(1)
const totalCourses = ref(0)
const courses = ref<any[]>([])
const createDialogVisible = ref(false)
const creating = ref(false)

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
        await fetchCoursesWithToken(page)
    } catch (error: any) {
        if (error.response?.status === 403) {
            const refreshed = await tryRefreshToken()
            if (refreshed) {
                try {
                    await fetchCoursesWithToken(page)
                } catch {
                    ElMessage.error('Failed to load courses')
                }
            } else {
                ElMessage.error('Session expired. Please log in again.')
                await logout()
            }
        } else {
            ElMessage.error('Failed to load courses')
        }
    }
}

const fetchCoursesWithToken = async (page: number) => {
    const res = await axios.get('/fxedu/api/courses/page', {
        params: { page, size: pageSize },
        headers: getAuthHeaders()
    })
    // Assuming backend returns { records, total }
    courses.value = res.data.records
    totalCourses.value = res.data.total
    currentPage.value = page
}

onMounted(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        console.log('JWT payload: ', payload)
    }
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

// Extend the DTO locally to include the two flags
type CourseCreateForm = CourseCreateDTO & {
    isActive: boolean
    isOpen: boolean
}

const createForm = ref<CourseCreateForm>({
    courseName: '',
    courseDescription: '',
    username: storedUser.username,
    isActive: true, // default on
    isOpen: true    // default open to join
})

const createFormRef = ref<FormInstance>()

const createRules: FormRules = {
    courseName: [
        { required: true, message: 'Please enter a course name', trigger: 'blur' },
        { min: 2, max: 64, message: '2–64 characters', trigger: 'blur' }
    ],
    courseDescription: [
        { required: true, message: 'Please enter a description', trigger: 'blur' },
        { min: 2, max: 512, message: '2–512 characters', trigger: 'blur' }
    ]
}

const enterCourse = (course: any) => {
    ElMessage.success(`Entering ${course.courseName || course.course_name}`)
    // router.push(`/courses/${course.id}`)
}

const editCourse = (course: any) => {
    ElMessage.info(`Editing ${course.courseName || course.course_name}`)
    // router.push(`/courses/${course.id}/edit`)
}

const onCreateCourse = () => {
    if (!canCreate.value) {
        ElMessage.error('Only teachers and admins can create courses.')
        return
    }
    createForm.value.username = storedUser.username
    createDialogVisible.value = true
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
        await router.push('/')
    }
}

// Small helper to create the course
const createCourse = (payload: CourseCreateForm) => {
    return axios.post('/fxedu/api/courses/create', payload, {
        headers: getAuthHeaders(),
    })
}

const submitCreateCourse = async () => {
    if (!createFormRef.value) return
    try {
        await createFormRef.value.validate()
    } catch {
        return
    }

    creating.value = true
    try {
        const first = await createCourse(createForm.value)
        if ((first as any).code && (first as any).code !== 200) {
            throw new Error((first as any).message || 'Failed to create course')
        }

        ElMessage.success('Course created successfully.')
        createDialogVisible.value = false
        await fetchCourses(currentPage.value)
    } catch (err: any) {
        if (err?.response?.status === 403 || err?.response?.status === 401) {
            const refreshed = await tryRefreshToken()
            if (refreshed) {
                try {
                    const second = await createCourse(createForm.value)
                    if ((second as any).code && (second as any).code !== 200) {
                        throw new Error((second as any).message || 'Failed to create course')
                    }
                    ElMessage.success('Course created successfully.')
                    createDialogVisible.value = false
                    await fetchCourses(currentPage.value)
                    creating.value = false
                    return
                } catch (inner: any) {
                    ElMessage.error(inner?.message || inner?.response?.data?.message || 'Failed to create course')
                    creating.value = false
                    return
                }
            } else {
                ElMessage.error('Session expired. Please log in again.')
                await logout()
                creating.value = false
                return
            }
        }

        const apiMsg = err?.response?.data?.message
        if (apiMsg) {
            ElMessage.error(apiMsg)
        } else {
            ElMessage.error(err?.message || 'Failed to create course')
        }
    } finally {
        creating.value = false
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
