import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5114/api',
})

// Request interceptor ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  register: async (username: string, password: string, profilePictureUrl: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    formData.append('profilePictureUrl', profilePictureUrl)
    
    return api.post('/Auth/Register', formData)
  },
  
  login: async (username: string, password: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    
    return api.post('/Auth/Login', formData)
  }
}

export const chatService = {
  getUserChats: () => {
    return api.get('/Chats/UserChats')
  },
  
  getChat: (chatId: string) => {
    return api.get(`/Chats/${chatId}`)
  },
  
  createChat: (usernames: string[], name?: string, isGroupChat = false) => {
    return api.post('/Chats', { usernames, name, isGroupChat })
  },
  
  sendMessage: (chatId: string, content: string) => {
    return api.post('/Chats/messages', { chatId, content })
  }
}

export const userService = {
  getUsers: () => {
    return api.get('/Users')
  }
} 