const N8N_WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL

function addChatBubble(chatMessages, texto, tipo) {
  const bubble = document.createElement('div')
  bubble.className = `chat-bubble ${tipo === 'user' ? 'user-bubble' : 'ai-bubble'}`
  bubble.textContent = texto
  chatMessages.appendChild(bubble)
  chatMessages.scrollTop = chatMessages.scrollHeight
  return bubble
}

export function initChat() {
  const chatMessages = document.getElementById('chat-messages')
  const chatInput = document.getElementById('chat-input')
  const chatSend = document.getElementById('chat-send')
  if (!chatMessages || !chatInput || !chatSend) return

  async function enviarMensaje() {
    const textoUsuario = chatInput.value.trim()
    if (!textoUsuario) return

    if (!N8N_WEBHOOK_URL) {
      addChatBubble(chatMessages, textoUsuario, 'user')
      addChatBubble(
        chatMessages,
        'Configura VITE_WEBHOOK_URL en tu .env para conectar el Asistente IA.',
        'ai'
      )
      chatInput.value = ''
      return
    }

    chatInput.value = ''
    chatSend.disabled = true
    addChatBubble(chatMessages, textoUsuario, 'user')
    const loadingBubble = addChatBubble(chatMessages, 'Pensando...', 'ai')

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textoUsuario })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const data = await response.json()
      loadingBubble.textContent = data.reply || 'No obtuve una respuesta del asistente.'
    } catch (error) {
      loadingBubble.textContent = 'Ocurrió un error al contactar al asistente. Intenta de nuevo.'
      console.error('Error al llamar al webhook de GeekRadar:', error)
    } finally {
      chatSend.disabled = false
    }
  }

  chatSend.addEventListener('click', enviarMensaje)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') enviarMensaje()
  })
}
