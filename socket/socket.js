const { Server } = require("socket.io");
const io = new Server(3001, { 
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});


// const io = require('socket.io')(6000,{
    
// })

let users = [];

const addUser = ( userId, socketId, userInfo) =>{

    const checkUser = users.some(u => u.userId === userId);

    if(!checkUser && userId){
        users.push({userId, socketId, userInfo});
    }

}

const removeUser = (socketId) =>{
    users = users.filter(u => u.socketId !== socketId);
}

io.on("connection", (socket)=>{
    console.log("connected")
    socket.on('addUser', (userId, userInfo) =>{
        addUser( userId, socket.id , userInfo)
        io.emit( 'getUser', users)
    })

    socket.on('disconnection', ()=>{
        removeUser(socket.id)
        io.emit( 'getUser', users)
    })

    socket.on('sendMessage', ( message ) =>{

        const findUser = users.some( u=> u.userId === message.reserverId);
        
        if(findUser){
            console.log(message)
            io.emit('getMessage',message)
        }
    })

})
