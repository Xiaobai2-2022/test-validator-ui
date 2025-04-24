<template>
    <div>
        <div class="banner">
            <h1>Welcome to the Test Validator</h1>
            <p>Register or Login to Test</p>
        </div>
        <div class="form-wrapper">
            <el-tabs v-model="activeTab" stretch>
                <!-- Login Tab -->
                <el-tab-pane label="Login" name="login">
                    <el-form :model="loginForm" :rules="loginRules" ref="loginRef" label-width="140px" label-position="left">
                        <el-form-item label="Username or Email" prop="loginUser">
                            <el-input v-model="loginForm.loginUser" class="input-field" />
                        </el-form-item>
                        <el-form-item label="Password" prop="password">
                            <el-input :type="showLoginPassword ? 'text' : 'password'" v-model="loginForm.password" class="input-field">
                                <template #suffix>
                                    <Component
                                        class="icon-style"
                                        :is="showLoginPassword ? View : Hide"
                                        style="cursor: pointer;"
                                        @click="showLoginPassword=!showLoginPassword"
                                    />
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="onLogin">Login</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- Register Tab -->
                <el-tab-pane label="Register" name="register">
                    <el-form :model="registerForm" :rules="registerRules" ref="registerRef" label-width="140px" label-position="left">
                        <el-form-item label="Username" prop="username">
                            <el-input v-model="registerForm.username" class="input-field" />
                        </el-form-item>
                        <el-form-item label="Display Name" prop="displayName">
                            <el-input v-model="registerForm.displayName" class="input-field" />
                        </el-form-item>

                        <el-form-item label="Email" prop="email">
                            <div class="email-input-wrapper">
                                <el-input v-model="registerForm.email" class="input-email input-field" />
                                <el-button
                                    size="large"
                                    type="primary"
                                    @click="sendCode"
                                    :disabled="codeSent"
                                    class="send-code-btn">
                                    {{ resendTimer > 0 ? `${resendTimer}s` : 'Send Code' }}
                                </el-button>
                            </div>
                        </el-form-item>

                        <el-form-item label="Password" prop="password">
                            <el-input :type="showPassword ? 'text' : 'password'" v-model="registerForm.password" class="input-field">
                                <template #suffix>
                                    <Component
                                        class="icon-style"
                                        :is="showPassword ? View : Hide"
                                        style="cursor: pointer;"
                                        @click="showPassword=!showPassword"
                                    />
                                </template>
                            </el-input>
                        </el-form-item>

                        <el-form-item label="Confirm Password" prop="passwordConfirmation">
                            <el-input :type="showConfirmPassword ? 'text' : 'password'" v-model="registerForm.passwordConfirmation" class="input-field">
                                <template #suffix>
                                    <Component
                                        class="icon-style"
                                        :is="showConfirmPassword ? View : Hide"
                                        style="cursor: pointer;"
                                        @click="showConfirmPassword=!showConfirmPassword"
                                    />
                                </template>
                            </el-input>
                        </el-form-item>

                        <el-form-item label="Verification Code" prop="verificationCode">
                            <el-input v-model="registerForm.verificationCode" class="input-field" />
                        </el-form-item>
                        <el-form-item label="User Type" prop="userType">
                            <el-select v-model="registerForm.userType" placeholder="Select user type" class="input-field">
                                <el-option label="Admin" value="0" />
                                <el-option label="Teacher" value="1" />
                                <el-option label="Assistant" value="2" />
                                <el-option label="Student" value="3" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="onRegister">Register</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { View, Hide } from '@element-plus/icons-vue'
import { AuthController } from '@/controllers/AuthController'
import type { LoginDTO, RegisterDTO, RegisterFrontEndDTO } from '@/models/User'
import axios from 'axios'

const router = useRouter()
const activeTab = ref('login')

// Password visibility
const showLoginPassword = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Login
const loginForm = ref<LoginDTO>({ loginUser: '', password: '' })
const loginRef = ref<FormInstance>()
const loginRules: FormRules = {
    loginUser: [{ required: true, message: 'Username or email is required', trigger: 'blur' }],
    password: [{ required: true, message: 'Password is required', trigger: 'blur' }]
}

const onLogin = () => {
    loginRef.value?.validate((valid) => {
        if (valid) {
            AuthController.login(loginForm.value)
                .then((response: any) => {
                    if (typeof response?.accessToken === 'string' && response.accessToken.trim() !== '') {
                        localStorage.setItem('access_token', response.accessToken)
                        localStorage.setItem('user', JSON.stringify(response.user))
                        router.push('/coursepage')
                    }
                })
                .catch((error) => {
                    ElMessage.error(error.response?.data || 'Login failed')
                })
        } else {
            ElMessage.warning('Please correct the form.')
        }
    })
}

// Register
const registerForm = ref<RegisterFrontEndDTO>({
    username: '',
    password: '',
    passwordConfirmation: '',
    displayName: '',
    email: '',
    verificationCode: '',
    userType: '3'
})

const registerRef = ref<FormInstance>()
const registerRules: FormRules = {
    username: [{ required: true, message: 'Username is required', trigger: 'blur' }],
    displayName: [{ required: true, message: 'Display name is required', trigger: 'blur' }],
    email: [
        { required: true, message: 'Email is required', trigger: 'blur' },
        { type: 'email', message: 'Invalid email format', trigger: ['blur', 'change'] }
    ],
    password: [
        { required: true, message: 'Password is required', trigger: 'blur' },
        {
            validator: (_rule, value: string, callback: (error?: Error ) => void) => {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/
                if(!passwordRegex.test(value)) {
                    callback(new Error(
                        'Password must be 8–64 chars, with upper/lowercase, number & symbol'
                    ))
                } else {
                    callback()
                }
            }
        }
    ],
    passwordConfirmation: [
        { required: true, message: 'Password Confirmation is required', trigger: 'blur' },
        {
            validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
                if (value !== registerForm.value.password) {
                    callback(new Error('Passwords do not match'))
                } else {
                    callback()
                }
            },
            trigger: ['blur', 'change']
        }
    ],
    verificationCode: [{ required: true, message: 'Verification code is required', trigger: 'blur' }],
    userType: [{ required: true, message: 'User type is required', trigger: 'change' }]
}

const onRegister = () => {
    registerRef.value?.validate((valid) => {
        if (valid) {
            const dto: RegisterDTO = {
                username: registerForm.value.username,
                password: registerForm.value.password,
                displayName: registerForm.value.displayName,
                email: registerForm.value.email,
                verificationCode: registerForm.value.verificationCode,
                userType: registerForm.value.userType
            }
            AuthController.register(dto)
                .then((response: any) => {
                    if (typeof response?.accessToken === 'string' && response.accessToken.trim() !== '') {
                        localStorage.setItem('access_token', response.accessToken)
                        router.push('/coursepage')
                    }
                })
                .catch((error: any) => {
                    const message = error.response?.data || 'Registration failed'
                    ElMessage.error(message)
                })
        } else {
            ElMessage.warning('Please correct the form.')
        }
    })
}

// Verification Code Timer
const codeSent = ref(false)
const resendTimer = ref(0)
let countdownTimer: number | null = null

const startResendCooldown = () => {
    resendTimer.value = 120
    codeSent.value = true
    localStorage.setItem('resendCooldownEnd', `${Date.now() + 120000}`)
    countdownTimer = setInterval(() => {
        if (resendTimer.value > 0) {
            resendTimer.value--
        } else {
            codeSent.value = false
            clearInterval(countdownTimer!)
        }
    }, 1000)
}

const sendCode = async () => {
    if (!registerForm.value.email) {
        ElMessage.warning('Please enter an email first.')
        return
    }
    try {
        await axios.get(`/fxedu/api/auth/send-verify-code`, {
            params: { email: registerForm.value.email }
        })
        startResendCooldown()
        ElMessage.success('Verification code sent!')
    } catch (error: any) {
        const message = error.response?.data || 'Failed to send verification code.'
        ElMessage.error(message)
    }
}

onMounted(() => {
    const savedTime = localStorage.getItem('resendCooldownEnd')
    if (savedTime) {
        const remaining = Math.floor((+savedTime - Date.now()) / 1000)
        if (remaining > 0) {
            resendTimer.value = remaining
            codeSent.value = true
            countdownTimer = setInterval(() => {
                if (resendTimer.value > 0) {
                    resendTimer.value--
                } else {
                    codeSent.value = false
                    clearInterval(countdownTimer!)
                }
            }, 1000)
        }
    }
})
</script>

<style scoped>
.form-wrapper {
    max-width: 500px;
    margin: 100px auto;
}

.banner {
    background-color: #2196F3;
    color: white;
    padding: 20px;
    text-align: center;
    font-size: 24px;
    margin-bottom: 20px;
}

.email-input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.icon-style {
    width: 20px;
    height: 20px;
    cursor: pointer;
    color: #606266; /* Or any visible color you want */
}

.input-field {
    height: 32px;
}

.input-email {
    flex-grow: 6;
    width: 0;
}

.send-code-btn {
    flex-grow: 1;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
