import axios from 'axios';
import type { LoginDTO, RegisterDTO } from '@/models/user.ts';

const authUrl = '/fxedu/api/auth'

export const login = (data: LoginDTO) => axios.post(`${authUrl}/login`, data);
export const register = (data: RegisterDTO) => axios.post(`${authUrl}/register`, data);
