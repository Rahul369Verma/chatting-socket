const io = require("socket.io")(process.env.PORT || 8999, {
  cors: {
    origin: "http://localhost:3000"
  }
})

let users = []

const getSocket = (email) => {
  return users.find((user) => user.userEmail === email)
}

const addUser = (userEmail, socketId) => {
  !users.some((user) => user.userEmail === userEmail) &&
    users.push({userEmail, socketId})
}

const removeUser = (socketId) => {
  users = users.filter(user => user.socketId !== socketId)
}

io.on("connection", (socket) => {
  console.log("a user connected")
  io.emit("welcome", "hello this is socket server")
  socket.on("addUser", (userEmail) => {
    addUser(userEmail, socket.id)
    io.emit("getUsers", users)
  })

  socket.on("sendMessage", async ({friend, conversationId, senderEmail, receiverEmail, text}) => {
    const receiver = await getSocket(receiverEmail)
    console.log(friend, conversationId, senderEmail, receiverEmail, text)
    io.to(receiver?.socketId).emit("getMessage", {friend, conversationId, senderEmail, text})
  })

  socket.on("messageSeen", async ({conversationId, senderEmail}) => {
    const receiver = await getSocket(senderEmail)
    console.log(conversationId, senderEmail)
    io.to(receiver?.socketId).emit("getMessageSeen", {conversationId})
  })
  socket.on("messageDelivered", async ({conversationId, senderEmail}) => {
    const receiver = await getSocket(senderEmail)
    console.log(conversationId, senderEmail)
    io.to(receiver?.socketId).emit("getMessageDelivered", {conversationId})
  })



  socket.on("disconnect", () => {
    console.log("a user disconnected")
    removeUser(socket.id)
    io.emit("getUsers", users)

  })

})
