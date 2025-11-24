function socketHandler(io) {
    io.on("connection", (socket) => {
        console.log("Student connected:", socket.id);

        const { student_id } = socket.handshake.query || {};
        if (student_id) socket.join(student_id);

        socket.on("join", (sid) => socket.join(sid));
    });
}

module.exports = socketHandler;
