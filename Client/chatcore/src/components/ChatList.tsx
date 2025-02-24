import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { chatService, userService } from '../services/api'

export function ChatList() {
  const { user, logout } = useAuthStore()
  const { chats, selectedChat, setSelectedChat } = useChatStore()
  const [showPrivateModal, setShowPrivateModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [username, setUsername] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupUsernames, setGroupUsernames] = useState<string[]>([])
  const [error, setError] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [chatSearchTerm, setChatSearchTerm] = useState('')

  const handleChatSelect = async (chat: any) => {
    try {
      const response = await chatService.getChat(chat.id)
      const sortedMessages = response.data.messages.sort((a: any, b: any) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      )
      setSelectedChat({
        ...response.data,
        messages: sortedMessages
      })
    } catch (err) {
      console.error('Sohbet mesajları yüklenirken hata:', err)
    }
  }

  const handleCreatePrivateChat = async () => {
    if (!username.trim()) {
      setError('Kullanıcı adı giriniz')
      return
    }
    try {
      await chatService.createChat([username, user!.username], '', false)
      setShowPrivateModal(false)
      setUsername('')
      setSearchTerm('')
    } catch (err) {
      setError('Sohbet oluşturulurken bir hata oluştu')
    }
  }

  const handleCreateGroupChat = async () => {
    if (!groupName.trim()) {
      setError('Grup adı giriniz')
      return
    }
    if (groupUsernames.length < 2) {
      setError('En az 2 kullanıcı eklemelisiniz')
      return
    }
    try {
      await chatService.createChat([...groupUsernames, user!.username], groupName, true)
      setShowGroupModal(false)
      setGroupName('')
      setGroupUsernames([])
      setSearchTerm('')
    } catch (err) {
      setError('Grup oluşturulurken bir hata oluştu')
    }
  }

  const handleLogout = () => {
    logout()
    document.location.reload()
  }

  // Kullanıcı listesini yükle
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await userService.getUsers()
        const otherUsers = response.data.filter((u: any) => u.id !== user?.id)
        setUsers(otherUsers)
      } catch (err) {
        console.error('Kullanıcılar yüklenirken hata:', err)
      }
    }
    loadUsers()
  }, [user])

  // Arama terimine göre kullanıcıları filtrele
  useEffect(() => {
    const filtered = users.filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  // Sohbet arama fonksiyonu
  const filteredChats = chats.filter(chat => {
    const chatUser = chat.users.find(u => u.id !== user?.id)
    const searchText = chat.isGroupChat ? chat.name : chatUser?.username
    return searchText?.toLowerCase().includes(chatSearchTerm.toLowerCase())
  })

  return (
    <div className="people-list d-flex flex-column">
      <div className="input-group mb-3">
        <input 
          type="text" 
          className="form-control" 
          placeholder="Sohbet ara..." 
          value={chatSearchTerm}
          onChange={(e) => setChatSearchTerm(e.target.value)}
          style={{ borderRadius: '0.25rem' }}
        />
        <div className="input-group-append" style={{ marginLeft: '10px' }}>
          <span className="input-group-text" style={{ borderRadius: '0.25rem' }}>
            <i className="fa fa-search"></i>
          </span>
        </div>
      </div>
      
      <div className="d-flex flex-column" style={{ flex: 1, minHeight: 0 }}>
        <ul className="list-unstyled chat-list flex-grow-1" style={{ overflowY: 'auto' }}>
          {filteredChats.map((chat) => {
            const chatUser = chat.users.find(u => u.id !== user?.id)
            return (
              <li key={chat.id} 
                className={`clearfix ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => handleChatSelect(chat)}
              >
                <img src={chat.isGroupChat 
                  ? "https://cdn.pixabay.com/photo/2017/11/10/05/46/group-2935521_1280.png"
                  : chatUser?.profilePictureUrl} 
                  alt="avatar" 
                />
                <div className="about">
                  <div className="name">
                    {chat.isGroupChat ? chat.name : chatUser?.username}
                  </div>
                  {!chat.isGroupChat && (
                    <div className="status">
                      <i className={`fa fa-circle ${chatUser?.isOnline ? 'online' : 'offline'}`}></i>
                      {chatUser?.isOnline 
                        ? ' çevrimiçi'
                        : ` ${new Date(chatUser?.lastSeen || '').toLocaleString()}`
                      }
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        <div className="border-top pt-3 pb-3 px-3">
          <div className="d-flex flex-column gap-2">
            <button 
              className="btn btn-primary"
              onClick={() => setShowPrivateModal(true)}
            >
              <i className="fa fa-user-plus mr-2"></i>
              Yeni Özel Sohbet
            </button>
            <button 
              className="btn btn-success"
              onClick={() => setShowGroupModal(true)}
            >
              <i className="fa fa-users mr-2"></i>
              Yeni Grup Sohbeti
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleLogout}
            >
              <i className="fa fa-sign-out mr-2"></i>
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      {showPrivateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ 
            maxWidth: '500px',
            margin: '1.75rem auto'
          }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Yeni Özel Sohbet</h5>
                <button type="button" className="close" onClick={() => {
                  setShowPrivateModal(false)
                  setError('')
                  setUsername('')
                  setSearchTerm('')
                }}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="form-group">
                  <label>Kullanıcı Adı</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={username || searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setUsername('')
                    }}
                    placeholder="Kullanıcı adını yazın..."
                  />
                </div>
                {searchTerm && !username && (
                  <ul className="list-group mt-2">
                    {filteredUsers.map(user => (
                      <li 
                        key={user.id} 
                        className="list-group-item list-group-item-action"
                        onClick={() => {
                          setUsername(user.username)
                          setSearchTerm('')
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {user.username}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPrivateModal(false)
                    setError('')
                    setUsername('')
                    setSearchTerm('')
                  }}
                >
                  İptal
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleCreatePrivateChat}
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGroupModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ 
            maxWidth: '500px',
            margin: '1.75rem auto'
          }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Yeni Grup Sohbeti</h5>
                <button type="button" className="close" onClick={() => {
                  setShowGroupModal(false)
                  setError('')
                  setGroupName('')
                  setGroupUsernames([])
                  setSearchTerm('')
                }}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="form-group mb-3">
                  <label>Grup Adı</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Grup adını girin"
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Kullanıcı Ekle</label>
                  <div className="input-group">
                    <input 
                      type="text"
                      className="form-control"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Kullanıcı adını yazın..."
                    />
                  </div>
                  {searchTerm && (
                    <ul className="list-group mt-2">
                      {filteredUsers
                        .filter(user => !groupUsernames.includes(user.username))
                        .map(user => (
                          <li 
                            key={user.id} 
                            className="list-group-item list-group-item-action"
                            onClick={() => {
                              setGroupUsernames([...groupUsernames, user.username])
                              setSearchTerm('')
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {user.username}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
                {groupUsernames.length > 0 && (
                  <div className="form-group">
                    <label>Eklenen Kullanıcılar</label>
                    <ul className="list-group">
                      {groupUsernames.map((username, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          {username}
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => setGroupUsernames(groupUsernames.filter(u => u !== username))}
                          >
                            <i className="fa fa-times"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowGroupModal(false)
                    setError('')
                    setGroupName('')
                    setGroupUsernames([])
                    setSearchTerm('')
                  }}
                >
                  İptal
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleCreateGroupChat}
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 