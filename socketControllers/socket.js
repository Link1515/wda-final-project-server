import { customAlphabet } from 'nanoid'
import games from '../models/games.js'

const nanoid = customAlphabet('0123456789', 6)
let activeRooms = []

export default (io) => {
  return (socket) => {
    console.log('連線' + socket.id)

    socket.on('createRoom', async ({ playerId, playerName, playerAmount, gameId }) => {
      const roomId = nanoid()

      socket.join(roomId)

      const gameInfo = await games.findById(gameId)
      const creatorInfo = {
        role: 1,
        socketId: socket.id,
        playerId,
        name: playerName,
        ready: false,
        stepDone: false
      }
      activeRooms.push({
        roomId,
        playerAmount,
        gameId,
        gameInfo,
        gameStep: 0,
        playerList: [creatorInfo]
      })
      socket.currentRoom = activeRooms.at(-1)
      socket.playerInfo = socket.currentRoom.playerList[0]

      socket.emit('joinRoomSuccess', { roomId, gameInfo, playerAmount })
      socket.emit('updateRoomData', { joinedPlayerAmount: 1, playerList: [creatorInfo] })
    })

    socket.on('joinRoom', ({ playerId, playerName, roomId }) => {
      let playerAmount = ''
      let hasRoom = false
      for (const room of activeRooms) {
        if (room.roomId === roomId) {
          playerAmount = room.playerAmount
          hasRoom = true
          socket.currentRoom = room
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

      for (const player of socket.currentRoom.playerList) {
        if (playerId === player.playerId && playerId !== '') {
          socket.emit('error', '帳戶於其他瀏覽器使用中')
          return
        }
      }

      socket.currentRoom.playerList.push({
        role: 0,
        socketId: socket.id,
        playerId,
        name: playerName,
        ready: false,
        stepDone: false
      })
      socket.playerInfo = socket.currentRoom.playerList.at(-1)
      socket.join(roomId)

      socket.emit('joinRoomSuccess', { roomId, gameInfo: socket.currentRoom.gameInfo, playerAmount })
      io.to(roomId).emit('updateRoomData', { joinedPlayerAmount: io.sockets.adapter.rooms.get(roomId).size, playerList: socket.currentRoom.playerList })
      socket.to(roomId).emit('roomAnnouncement', `${playerName} 加入遊戲間`)
    })

    socket.on('toggleReady', ({ camp, campRoleId, funRoleId }) => {
      socket.playerInfo.ready = !socket.playerInfo.ready
      if (socket.playerInfo.ready) {
        socket.playerInfo.camp = camp
        socket.playerInfo.campRoleId = campRoleId
        if (socket.currentRoom.gameInfo.enableFunRole) {
          socket.playerInfo.funRoleId = funRoleId
        }
      }

      io.to(socket.currentRoom.roomId).emit('updateRoomData', { joinedPlayerAmount: io.sockets.adapter.rooms.get(socket.currentRoom.roomId).size, playerList: socket.currentRoom.playerList })
    })

    // 流程開始
    socket.on('runStep', () => {
      socket.currentRoom.gameStep = 0
      io.to(socket.currentRoom.roomId).emit('runStep', socket.currentRoom.gameStep)
      socket.currentRoom.gameStep++
    })

    socket.on('stepDone', () => {
      if (socket.currentRoom.gameStep < 0) return

      socket.playerInfo.stepDone = true
      let allPlayerStepDone = true
      for (const player of socket.currentRoom.playerList) {
        if (!player.stepDone) {
          allPlayerStepDone = false
          break
        }
      }

      if (allPlayerStepDone) {
        if (socket.currentRoom.gameStep === socket.currentRoom.gameInfo.stepList.length) {
          socket.currentRoom.gameStep = 0
        } else {
          io.to(socket.currentRoom.roomId).emit('runStep', socket.currentRoom.gameStep)
          socket.currentRoom.gameStep++
          for (const player of socket.currentRoom.playerList) {
            player.stepDone = false
          }
        }
      }
    })

    socket.on('resetStep', () => {
      socket.currentRoom.gameStep = -1
    })

    socket.on('disconnect', () => {
      if (socket.currentRoom) {
        socket.currentRoom.playerList = socket.currentRoom.playerList.filter(player => player.socketId !== socket.id)

        if (io.sockets.adapter.rooms.get(socket.currentRoom.roomId)) {
          if (socket.playerInfo.role === 1) {
            socket.currentRoom.playerList[0].role = 1
          }
          io.to(socket.currentRoom.roomId).emit('updateRoomData', { joinedPlayerAmount: io.sockets.adapter.rooms.get(socket.currentRoom.roomId).size, playerList: socket.currentRoom.playerList })
        } else {
          activeRooms = activeRooms.filter(room => room.roomId !== socket.currentRoom.roomId)
        }
      }

      console.log('斷線')
    })
  }
}
