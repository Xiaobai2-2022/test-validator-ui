import axios from 'axios'

export function useAuth() {
    const tryRefreshToken = async (): Promise<boolean> => {
        try {
            const res = await axios.get('/fxedu/api/auth/refresh', {
                withCredentials: true
            })
            localStorage.setItem('access_token', res.data.accessToken)
            return true
        } catch {
            return false
        }
    }

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
    })

    return {
        tryRefreshToken,
        getAuthHeaders
    }
}
