import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('0123456789', 6)
let activeRooms = []

export default (io) => {
  return (socket) => {
    console.log('連線' + socket.id)

    socket.on('createRoom', ({ playerId, playerName, playerAmount, gameId }) => {
      const roomId = nanoid()

      socket.roomId = roomId

      socket.join(roomId)

      const creatorInfo = { role: 1, socketId: socket.id, playerId, name: playerName, ready: false }
      activeRooms.push({
        roomId,
        playerAmount,
        gameId,
        playerList: [creatorInfo]
      })
      socket.emit('joinRoomSuccess', { roomId, playerAmount })
      socket.emit('updateRoomData', { joinedPlayerAmount: 1, playerList: [creatorInfo] })
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
        if (playerId === player.playerId) {
          socket.emit('error', '帳戶於其他瀏覽器使用中')
          return
        }
      }

      socket.roomId = roomId

      socket.join(roomId)
      socket.emit('joinRoomSuccess', { roomId, playerAmount })
      currentRoom.playerList.push({ role: 0, socketId: socket.id, playerId, name: playerName, ready: false })
      io.to(roomId).emit('updateRoomData', { joinedPlayerAmount: io.sockets.adapter.rooms.get(roomId).size, playerList: currentRoom.playerList })
    })

    socket.on('toggleReady', () => {
      const currentRoom = activeRooms.filter(room => room.roomId === socket.roomId)[0]
      if (currentRoom) {
        const playerIndex = currentRoom.playerList.findIndex(player => player.socketId === socket.id)

        currentRoom.playerList[playerIndex].ready = !currentRoom.playerList[playerIndex].ready
        io.to(socket.roomId).emit('updateRoomData', { joinedPlayerAmount: io.sockets.adapter.rooms.get(socket.roomId).size, playerList: currentRoom.playerList })
      }
    })

    socket.on('disconnect', () => {
      if (socket.roomId) {
        const currentRoom = activeRooms.filter(room => room.roomId === socket.roomId)[0]
        const leavingPlayer = currentRoom.playerList.filter(player => player.socketId === socket.id)[0]

        if (leavingPlayer.role === 1) {
          currentRoom.playerList[1].role = 1
        }

        currentRoom.playerList = currentRoom.playerList.filter(player => player.socketId !== socket.id)

        if (io.sockets.adapter.rooms.get(socket.roomId)) {
          io.to(socket.roomId).emit('updateRoomData', { joinedPlayerAmount: io.sockets.adapter.rooms.get(socket.roomId).size, playerList: currentRoom.playerList })
        } else {
          activeRooms = activeRooms.filter(room => room.roomId !== socket.roomId)
        }
      }

      console.log('斷線')
    })
  }
}
