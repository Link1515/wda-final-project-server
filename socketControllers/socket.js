import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('0123456789', 6)
const activeRooms = []

export default (io) => {
  return (socket) => {
    console.log('連線' + socket.id)

    socket.on('createRoom', ({ playerId, playerName, playerAmount, gameId }) => {
      const roomId = nanoid()
      socket.playerId = playerId
      socket.playerName = playerName
      socket.roomId = roomId

      socket.join(roomId)

      activeRooms.push({
        roomId,
        playerAmount,
        gameId,
        playerList: [{ id: playerId, name: playerName, ready: false }]
      })
      socket.emit('joinRoomSuccess', { roomId, playerAmount })
      socket.emit('updateRoomData', { joinedPlayerAmount: 1, playerList: [{ id: playerId, name: playerName, ready: false }] })
    })

    socket.on('joinRoom', ({ playerId, playerName, roomId }) => {
      let playerAmount = ''
      let hasRoom = false
      let currentRoom = {}
      for (const room of activeRooms) {
        if (room.roomId === roomId) {
          playerAmount = room.playerAmount
          hasRoom = true
          currentRoom = room
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

      for (const player of currentRoom.playerList) {
        if (playerId === player.id) {
          socket.emit('error', '帳戶於其他瀏覽器使用中')
          return
        }
      }

      socket.playerId = playerId
      socket.playerName = playerName
      socket.roomId = roomId

      socket.join(roomId)
      socket.emit('joinRoomSuccess', { roomId, playerAmount })
      currentRoom.playerList.push({ id: playerId, name: playerName, ready: false })
      io.to(roomId).emit('updateRoomData', { joinedPlayerAmount: io.sockets.adapter.rooms.get(roomId).size, playerList: currentRoom.playerList })
    })

    socket.on('disconnect', () => {
      if (socket.roomId) {
        const currentRoom = activeRooms.filter(room => room.roomId === socket.roomId)[0]
        currentRoom.playerList = currentRoom.playerList.filter(player => player.id !== socket.playerId)
        io.to(socket.roomId).emit('updateRoomData', { joinedPlayerAmount: io.sockets.adapter.rooms.get(socket.roomId).size, playerList: currentRoom.playerList })
      }
      console.log('斷線')
    })
  }
}
