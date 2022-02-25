import { customAlphabet } from 'nanoid'
import games from '../models/games.js'

const nanoid = customAlphabet('0123456789', 6)
let activeRooms = []

export default (io) => {
  return (socket) => {
    socket.on('createRoom', async ({ playerId, playerName, avatar, playerAmount, gameId }) => {
      const roomId = nanoid()

      socket.join(roomId)

      const gameInfo = await games.findById(gameId)
      const creatorInfo = {
        role: 1,
        socketId: socket.id,
        playerId,
        name: playerName,
        avatar,
        ready: false,
        stepDone: false,
        alive: true
      }
      activeRooms.push({
        startState: false,
        roomId,
        playerAmount,
        gameId,
        gameInfo,
        stepIndex: -1,
        gameStep: 0,
        shownPlayers: [],
        markedPlayers: [],
        markedResult: [],
        skipInc: [-1, -1],
        playerList: [creatorInfo]
      })
      socket.currentRoom = activeRooms.at(-1)
      socket.playerInfo = socket.currentRoom.playerList[0]

      socket.emit('joinRoomSuccess', { roomId, gameInfo, playerAmount, socketId: socket.id })
      socket.emit('updateRoomData', { joinedPlayerAmount: 1, playerList: [creatorInfo] })
    })

    socket.on('joinRoom', ({ playerId, playerName, avatar, roomId }) => {
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
        avatar,
        ready: false,
        stepDone: false,
        alive: true
      })
      socket.playerInfo = socket.currentRoom.playerList.at(-1)
      socket.join(roomId)

      socket.emit('joinRoomSuccess', { roomId, gameInfo: socket.currentRoom.gameInfo, playerAmount, socketId: socket.id })
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

    socket.on('eliminatePlayer', (localPlayerList) => {
      socket.currentRoom.playerList.forEach(player => {
        localPlayerList.forEach(localPlayer => {
          if (player.socketId === localPlayer.socketId) {
            player.alive = localPlayer.alive
          }
        })
      })

      io.to(socket.currentRoom.roomId).emit('updateRoomData', { joinedPlayerAmount: io.sockets.adapter.rooms.get(socket.currentRoom.roomId).size, playerList: socket.currentRoom.playerList })
    })

    socket.on('start', () => {
      socket.currentRoom.startState = true
      io.to(socket.currentRoom.roomId).emit('start', socket.currentRoom.startState)
    })

    socket.on('backToSetting', () => {
      io.to(socket.currentRoom.roomId).emit('backToSetting')
      socket.currentRoom.playerList.forEach(player => {
        player.ready = false
        player.camp = ''
        player.campRoleId = ''
      })
      io.to(socket.currentRoom.roomId).emit('updateRoomData', { joinedPlayerAmount: io.sockets.adapter.rooms.get(socket.currentRoom.roomId).size, playerList: socket.currentRoom.playerList })
    })

    // 流程開始
    socket.on('startStep', (stepIndex) => {
      socket.currentRoom.gameStep = 0
      socket.currentRoom.stepIndex = stepIndex
      io.to(socket.currentRoom.roomId).emit('runStep', { stepIndex, gameStep: socket.currentRoom.gameStep })
    })

    socket.on('stepDone', (markState) => {
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
        for (const player of socket.currentRoom.playerList) {
          player.stepDone = false
        }

        if (socket.currentRoom.gameStep >= socket.currentRoom.gameInfo.stepList[socket.currentRoom.stepIndex].rules.length) {
          socket.currentRoom.gameStep = -1
          io.to(socket.currentRoom.roomId).emit('showMarkedResult', socket.currentRoom.markedResult)
          io.to(socket.currentRoom.roomId).emit('resetStep')
          socket.currentRoom.markedResult = []
          socket.currentRoom.shownPlayers = []
        } else {
          if (socket.currentRoom.gameInfo.stepList[socket.currentRoom.stepIndex].rules[socket.currentRoom.gameStep].mode === '標記' && markState) {
            let name, avatar
            if (socket.currentRoom.markedPlayers.length) {
              const randomIndex = Math.round(Math.random() * (socket.currentRoom.markedPlayers.length - 1))
              const targetPlyerSocketId = socket.currentRoom.markedPlayers[randomIndex]
              const targetPlayer = socket.currentRoom.playerList.filter(player => player.socketId === targetPlyerSocketId)[0]
              name = targetPlayer.name
              avatar = targetPlayer.avatar
            } else {
              const randomIndex = Math.round(Math.random() * (socket.currentRoom.shownPlayers.length - 1))
              name = socket.currentRoom.shownPlayers[randomIndex].name
              avatar = socket.currentRoom.shownPlayers[randomIndex].avatar
            }

            socket.currentRoom.markedResult.push({ name, avatar, markLabel: socket.currentRoom.gameInfo.stepList[socket.currentRoom.stepIndex].rules[socket.currentRoom.gameStep].data.label })

            socket.currentRoom.markedPlayers = []
            io.emit('updateMarkedPlayers', socket.currentRoom.markedPlayers)
          }

          if (socket.currentRoom.skipInc[0] >= 0) {
            socket.currentRoom.gameStep += socket.currentRoom.skipInc[0]
            socket.currentRoom.skipInc[0] = -1
          } else if (socket.currentRoom.skipInc[1] >= 0) {
            socket.currentRoom.gameStep += socket.currentRoom.skipInc[1]
            socket.currentRoom.skipInc[1] = -1
          } else {
            socket.currentRoom.gameStep++
          }

          if (socket.currentRoom.gameInfo.stepList[socket.currentRoom.stepIndex].rules[socket.currentRoom.gameStep]?.mode === '顯示' && socket.currentRoom.gameInfo.stepList[socket.currentRoom.stepIndex].rules[socket.currentRoom.gameStep]?.data.roleListType === 'labelResult') {
            io.to(socket.currentRoom.roomId).emit('updateMarkedResult', socket.currentRoom.markedResult)
          }

          io.to(socket.currentRoom.roomId).emit('runStep', { gameStep: socket.currentRoom.gameStep })
        }
      }
    })

    socket.on('resetStep', () => {
      socket.currentRoom.gameStep = -1
      socket.currentRoom.markedResult = []
      io.to(socket.currentRoom.roomId).emit('resetStep')
    })

    socket.on('updateMarkedPlayers', (markedPlayers) => {
      socket.currentRoom.markedPlayers = markedPlayers
      io.emit('updateMarkedPlayers', socket.currentRoom.markedPlayers)
    })

    socket.on('updateShownPlayers', (shownPlayers) => {
      socket.currentRoom.shownPlayers = shownPlayers
    })

    socket.on('updateSkipInc', (skipInc) => {
      socket.currentRoom.skipInc = skipInc
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
    })
  }
}
