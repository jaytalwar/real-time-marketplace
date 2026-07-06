let io;

export const initializeSocket = (socketInstance) => {
    io = socketInstance;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }

    return io;
};