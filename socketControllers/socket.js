import { nanoid } from 'nanoid'

const activeRooms = []

export default (io) => {
  return (socket) => {
    socket.on('createRoom', ({ playerName, playerAmount, gameId }) => {
      socket.playerName = playerName
      const roomId = nanoid(6)
      socket.join(roomId)
      activeRooms.push({ roomId, playerAmount, gameId, playerList: [{ name: playerName, ready: false }] })
      socket.emit('roomSetting', { roomId, playerAmount })
      console.log(io.sockets.adapter.rooms.get(roomId).size)
    })

    socket.on('joinRoom', (roomId) => {
      let hasRoom = false
      let playerAmount = ''

      for (const room of activeRooms) {
        if (room.roomId === roomId) {
          playerAmount = room.playerAmount
          hasRoom = true
          break
        }
      }

      if (!hasRoom) {
        socket.emit('error', '遊戲間 ID 不存在')
        return
      }

      socket.join(roomId)
      socket.emit('roomSetting', { roomId, playerAmount })
    })
  }
}
