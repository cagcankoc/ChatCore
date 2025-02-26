import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr'

class SignalRService {
  private static instance: SignalRService
  private connection: HubConnection | null = null
  private callbacks = {
    userConnected: new Set<(user: any) => void>(),
    userDisconnected: new Set<(user: any) => void>(),
    receiveMessage: new Set<(message: any) => void>(),
    chatCreated: new Set<(chat: any) => void>()
  }

  private constructor() {}

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService()
    }
    return SignalRService.instance
  }

  public async start() {
    if (this.connection) return

    try {
      const token = localStorage.getItem('token')
      
      this.connection = new HubConnectionBuilder()
        .withUrl('http://localhost:5114/chathub', {
          accessTokenFactory: () => token || ''
        })
        .withAutomaticReconnect()
        .build()

      // Event listeners
      this.connection.on('UserConnected', (user) => {
        this.callbacks.userConnected.forEach(callback => callback(user))
      })

      this.connection.on('UserDisconnected', (user) => {
        this.callbacks.userDisconnected.forEach(callback => callback(user))
      })

      this.connection.on('ReceiveMessage', (message) => {
        this.callbacks.receiveMessage.forEach(callback => callback(message))
      })

      this.connection.on('ChatCreated', (chat) => {
        this.callbacks.chatCreated.forEach(callback => callback(chat))
      })

      await this.connection.start()
      console.log('SignalR Connected')
    } catch (err) {
      console.error('SignalR Connection Error:', err)
    }
  }

  public async stop() {
    try {
      await this.connection?.stop()
      this.connection = null
      this.callbacks.userConnected.clear()
      this.callbacks.userDisconnected.clear()
      this.callbacks.receiveMessage.clear()
      this.callbacks.chatCreated.clear()
    } catch (err) {
      console.error('SignalR Stop Error:', err)
    }
  }

  public onUserConnected(callback: (user: any) => void) {
    this.callbacks.userConnected.add(callback)
  }

  public onUserDisconnected(callback: (user: any) => void) {
    this.callbacks.userDisconnected.add(callback)
  }

  public onReceiveMessage(callback: (message: any) => void) {
    this.callbacks.receiveMessage.add(callback)
  }

  public onChatCreated(callback: (chat: any) => void) {
    this.callbacks.chatCreated.add(callback)
  }
}

export const signalRService = SignalRService.getInstance() 