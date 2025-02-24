import { create } from 'zustand'

interface Chat {
  id: string
  name: string
  isGroupChat: boolean
  users: User[]
  messages: Message[]
}

interface User {
  id: string
  username: string
  profilePictureUrl: string
  isOnline: boolean
  lastSeen: Date
}

interface Message {
  senderId: string
  content: string
  sentAt: Date
}

interface ChatState {
  chats: Chat[]
  selectedChat: Chat | null
  setChats: (chats: Chat[]) => void
  setSelectedChat: (chat: Chat | null) => void
  addMessage: (chatId: string, message: Message) => void
  updateUserStatus: (userId: string, isOnline: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  selectedChat: null,
  setChats: (chats) => set({ chats }),
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  addMessage: (chatId, message) =>
    set((state) => {
      const chat = state.chats.find(c => c.id === chatId)
      if (!chat) return state

      const updatedChat = {
        ...chat,
        messages: [...chat.messages, message]
      }

      const updatedChats = state.chats.map(c => 
        c.id === chatId ? updatedChat : c
      )

      const updatedSelectedChat = state.selectedChat?.id === chatId 
        ? updatedChat 
        : state.selectedChat

      return {
        ...state,
        chats: updatedChats,
        selectedChat: updatedSelectedChat
      }
    }),
  updateUserStatus: (userId, isOnline) =>
    set((state) => ({
      chats: state.chats.map((chat) => ({
        ...chat,
        users: chat.users.map((user) =>
          user.id === userId ? { ...user, isOnline } : user
        ),
      })),
      selectedChat: state.selectedChat
        ? {
            ...state.selectedChat,
            users: state.selectedChat.users.map((user) =>
              user.id === userId ? { ...user, isOnline } : user
            ),
          }
        : null,
    })),
})) 