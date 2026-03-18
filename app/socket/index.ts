const logger = require("../utils/logger");
let io: any; // Declare variable
export const socketConnection = (server: any) => {
  io = require("socket.io")(server, {
    transports: ["polling"],
    cors: {
      cors: {
        origin: "*",
      },
    },
  });
  io.on("connection", (socket: any) => {
    socket.join(socket.request._query.id);
    socket.on("disconnect", () => {});
  });
  return io;
};
// socketConnection(server);

export const socketSendMessage = async (
  topicName: string,
  message?: string
) => {
  try {
    console.log("send message");
    io.emit(topicName, message);
    logger.info(`Published Data=> ${message}. To topic = ${topicName}`);
  } catch (error) {
    logger.info(
      `Failed to Publish a Data=> ${message}. To topic = ${topicName}`
    );
    console.log(error);
  }
}; // Emit data to particular key id

export const getRooms = () => io.sockets.adapter.rooms;
// module.exports = { socketSendMessage, getRooms };
