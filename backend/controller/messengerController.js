const User = require('../models/authModel');
const messageModel = require('../models/messageModel');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path')


const getLastMessage = async(myId, fdId) => {
     const msg = await messageModel.findOne({
          $or: [{
               $and: [{
                    senderId : {
                        $eq: myId
                    }
               },{
                    reseverId : {
                        $eq : fdId 
                    }
               }]
          }, {
               $and : [{
                    senderId : {
                         $eq : fdId
                    } 
               },{
                    reseverId : {
                         $eq : myId
                    }
               }]
          }]

     }).sort({
          updatedAt : -1
     });
     return msg;
}

module.exports.getFriends = async (req, res) => {
     // const myId = req.myId;
     // let fnd_msg = [];
     try{
     //      const friendGet = await User.find({
     //           _id: {
     //               $ne: myId
     //           }
     //      });
     //      for (let i = 0; i < friendGet.length; i++ ){
     //           let lmsg = await getLastMessage(myId,friendGet[i].id);
     //           fnd_msg = [...fnd_msg, {
     //                fndInfo : friendGet[i],
     //                msgInfo : lmsg
     //           }]
               
     //      }

     //      // const filter = friendGet.filter(d=>d.id !== myId );
     //      res.status(200).json({success:true, friends : fnd_msg})
     const myId = req.myId;
     const friends = await User.find({});
     const filter = friends.filter( d=> d.id !== myId )
     res.status(200).json({success:true, friends:filter});

     }catch (error) {
          res.status(500).json({
               error: {
                    errorMessage :'Internal Sever Error'
               }
          })
     } 
}

module.exports.messageUploadDB = async (req, res) =>{

     const {
          senderName,
          receiverId,
          message
     } = req.body
     const senderId = req.myId;

     try{
          const insertMessage = await messageModel.create({
               senderId : senderId,
               senderName : senderName,
               reseverId : receiverId,
               message : {
                    text: message,
                    image : ''
               }
          })
          res.status(201).json({
               success : true,
               message: insertMessage
          })

     }catch (error){
          res.status(500).json({
               error: {
                    errorMessage : 'Internal Sever Error'
               }
          })
     }

     
}
module.exports.messageGet = async(req,res) => {
     const myId = req.myId;
     const fdId = req.params.id;

     try{
         
          let getAllMessage = await messageModel.find({});
          
          getAllMessage = getAllMessage.filter(m=>m.senderId === myId && m.reseverId === fdId || m.reseverId ===  myId && m.senderId === fdId );
          
          res.status(200).json({
               success: true,
               message: getAllMessage
          })

     }catch (error){
          res.status(500).json({
               error: {
                    errorMessage : 'Internal Server error'
               }
          })

     }
      
}


// module.exports.ImageMessageSend = (req,res) => {
//      const senderId = req.myId;
//      const form = formidable();

//      form.parse(req, (err, fields, files) => {
//           const {
//               senderName,
//               reseverId,
//               imageName 
//           } = fields;

//           const newPath = __dirname + `../../../frontend/public/image/${imageName}`
//           files.image.originalFilename = imageName;

//           try{
//                fs.copyFile(files.image.filepath, newPath, async (err)=>{
//                     if(err){
//                          res.status(500).json({
//                               error : {
//                                    errorMessage: 'Image upload fail'
//                               }
//                          })
//                     } else{
//                          const insertMessage = await messageModel.create({
//                               senderId : senderId,
//                               senderName : senderName,
//                               reseverId : reseverId,
//                               message : {
//                                    text: '',
//                                    image : files.image.originalFilename
//                               }
//                          })
//                          res.status(201).json({
//                               success : true,
//                               message: insertMessage
//                          })

//                     }
//                } )

//           }catch (error){
//                res.status(500).json({
//                     error : {
//                          errorMessage: 'Internal Sever Error'
//                     }
//                })

//           }


//      })
// }


module.exports.ImageMessageSend = (req, res) =>{
     const senderId = req.myId;
     var form = new formidable.IncomingForm();
     form.parse(req, (err, fields, files) => {
          
               const senderName = fields.senderName[0];
               const receiverId = fields.receiverId[0];     

          try {
               
               const getImageName = files.image[0].originalFilename;
               const randNumber = Math.floor(Math.random() * 99999 );
               const newImageName = randNumber + getImageName;
               files.image[0].originalFilename = newImageName;
               const newPath = path.resolve(__dirname, `../../frontend/public/chat_images/${files.image[0].originalFilename}`);
               


               fs.copyFile(files.image[0].filepath, newPath, async(error) => {
                    if(!error){

                         const messageCreate = await messageModel.create({
                              senderId : senderId,
                              senderName : senderName,
                              reseverId : receiverId,
                              message : {
                                   text: '',
                                   image : files.image[0].originalFilename
                              }
                         })
                         res.status(201).json({
                              success : true,
                              message: messageCreate
                         })  
                    }
                    else{
                         console.log(error)
                         res.status(500).json({
                              error: {
                                   errorMessage : ['Interanl Server Error']
                              }
                         })
                    }
               })

          } 
          catch (error) {
               console.log(error);
          }

          }

     )
}

module.exports.messageSeen = async (req,res) => {
     const messageId = req.body._id;

     await messageModel.findByIdAndUpdate(messageId, {
         status : 'seen' 
     })
     .then(() => {
          res.status(200).json({
               success : true
          })
     }).catch(() => {
          res.status(500).json({
               error : {
                    errorMessage : 'Internal Server Error'
               }
          })
     })
}


module.exports.delivaredMessage = async (req,res) => {
     const messageId = req.body._id;

     await messageModel.findByIdAndUpdate(messageId, {
         status : 'delivared' 
     })
     .then(() => {
          res.status(200).json({
               success : true
          })
     }).catch(() => {
          res.status(500).json({
               error : {
                    errorMessage : 'Internal Server Error'
               }
          })
     })
}