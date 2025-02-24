import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { chatService } from '../services/api'
import { signalRService } from '../services/signalR'
import { ChatList } from '../components/ChatList'
import { ChatWindow } from '../components/ChatWindow'

export function Chat() {
  const { user } = useAuthStore()
  const { updateUserStatus } = useChatStore()

  useEffect(() => {
    if (!user) return

    const initialize = async () => {
      try {
        // Sohbetleri yükle
        const response = await chatService.getUserChats()
        useChatStore.getState().setChats(response.data)

        // Socket bağlantısını başlat
        await signalRService.start()

        // Kullanıcı durumu değişikliklerini dinle
        signalRService.onUserConnected((connectedUser) => {
          console.log('User connected:', connectedUser)
          updateUserStatus(connectedUser.id, true)
        })

        signalRService.onUserDisconnected((disconnectedUser) => {
          console.log('User disconnected:', disconnectedUser)
          updateUserStatus(disconnectedUser.id, false)
        })

        // Yeni chat oluşturulduğunda sohbetleri güncelle
        signalRService.onChatCreated(async () => {
          console.log('Yeni sohbet oluşturuldu, sohbetler yenileniyor...')
          const response = await chatService.getUserChats()
          useChatStore.getState().setChats(response.data)
        })
      } catch (err) {
        console.error('Başlatma sırasında hata:', err)
      }
    }

    initialize()

    return () => {
      signalRService.stop()
    }
  }, [user, updateUserStatus])

  if (!user) return null

  return (
    <div className="container h-100">
      <div className="col-lg-12 h-100 mt-2">
        <div className="card chat-app h-100">
          <ChatList />
          <ChatWindow />
        </div>
      </div>
    </div>
  )
} 