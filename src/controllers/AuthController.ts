import { ElMessage } from 'element-plus'
import { login, register } from '@/api/Auth.ts'
import type { LoginDTO, RegisterDTO } from '@/models/User.ts'

export const AuthController = {

    async login (data: LoginDTO) {
        try {
            const res = await login(data);
            ElMessage.success('Login Successful');
            return res.data;
        } catch (error) {
                ElMessage.error('Login failed');
            }
        },

    async register(data: RegisterDTO) {
        try {
            const res = await register(data);
            ElMessage.success('Register Successful');
            return res.data;
        } catch (error) {
            ElMessage.error('Register failed');
        }
    }

}
