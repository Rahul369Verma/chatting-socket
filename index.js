const io = require("socket.io")(process.env.PORT || 8999, {
  cors: {
    origin: process.env.REACT_APP_URL || "http://localhost:3000"
  }
})

let users = []

const getSocket = (email) => {
  return users.find((user) => user.userEmail === email)
}

const addUser = (userEmail, socketId) => {
  !users.some((user) => user.userEmail === userEmail) &&
    users.push({ userEmail, socketId })
}

const removeUser = (socketId) => {
  users = users.filter(user => user.socketId !== socketId)
}

io.on("connection", (socket) => {
  console.log("a user connected")
  io.emit("welcome", "hello this is socket server")
  socket.on("addUser", async (userEmail) => {
    await addUser(userEmail, socket.id)
    console.log(users)
    await io.emit("getUsers", users)
  })

  socket.on("sendMessage", async ({ _id, conversationId, senderEmail, receiverEmail, text }) => {
    console.log(users)
    const receiver = await getSocket(receiverEmail)
    console.log("message Send", conversationId, senderEmail, receiverEmail, text)
    await io.to(receiver?.socketId).emit("getMessage", { conversationId, senderEmail, text, _id })
  })

  socket.on("messageSeen", async ({ _id, conversationId, senderEmail }) => {
    console.log("message Seen")
    const receiver = await getSocket(senderEmail)
    await io.to(receiver?.socketId).emit("getMessageSeen", { _id, conversationId })
  })
  socket.on("messageDelivered", async ({ _id, conversationId, senderEmail, all }) => {
    const receiver = await getSocket(senderEmail)
    await io.to(receiver?.socketId).emit("getMessageDelivered", { _id, conversationId, all })
  })
  socket.on("removeFriendRequest", async ({ data }) => {
    const receiver = await getSocket(data.senderEmail)
    await io.to(receiver?.socketId).emit("FriendRequest", { data })
  })
  socket.on("notification", async ({ email }) => {
    const receiver = await getSocket(email)
    await io.to(receiver?.socketId).emit("notification")
  })

  socket.on("acceptFriendRequest", async ({ data }) => {
    const receiver = await getSocket(data.receiverEmail)
    await io.to(receiver?.socketId).emit("FriendRequest", { data })
  })

  socket.on("typing", async ({ messageConversationId, friendData }) => {
    const receiver = await getSocket(friendData?.email)
    await io.to(receiver?.socketId).emit("typing", { messageConversationId })
  })





  socket.on("disconnect", () => {
    console.log("a user disconnected")
    removeUser(socket.id)
    io.emit("getUsers", users)

  })

})
