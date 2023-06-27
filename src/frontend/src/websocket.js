let ws

export const initws = () => {
  if (!ws) {
    ws = new WebSocket("ws://localhost:8000/ws/webcams/")
  }

  return ws
}

export const getws = () => {
  return ws
}
