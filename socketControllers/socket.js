import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('0123456789', 6)
const activeRooms = []

export default (io) => {
  return (socket) => {
    console.log('連線' + socket.id)
    socket.on('createRoom', ({ playerName, playerAmount, gameId }) => {
      const roomId = nanoid()
      socket.playerName = playerName
      socket.roomId = roomId

      socket.join(roomId)

      activeRooms.push({ roomId, playerAmount, gameId, playerList: [{ name: playerName, ready: false }] })
      socket.emit('joinRoomSuccess', { roomId, playerAmount })
    })

    socket.on('joinRoom', ({ roomId, playerName }) => {
      let hasRoom = false
      let playerAmount = ''
      socket.playerName = playerName
      socket.roomId = roomId

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

      if (io.sockets.adapter.rooms.get(roomId).size >= playerAmount) {
        socket.emit('error', '遊戲間已滿')
        return
      }

      socket.join(roomId)
      socket.emit('joinRoomSuccess', { roomId, playerAmount })
      io.to(roomId).emit('updateRoomData', { joinedPlayerAmount: io.sockets.adapter.rooms.get(roomId).size })
    })

    socket.on('disconnect', () => {
      console.log('斷線')
    })
  }
}
