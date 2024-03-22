const formidable = require('formidable');
const validator = require('validator');
const registerModel = require('../models/authModel');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const console = require('console');
const path = require('path')
 

module.exports.userRegister = (req, res) => {
     var form = new formidable.IncomingForm();
     form.parse(req, async (err, fields, files) => {

     const userName = fields.username[0];
     const email = fields.email[0];
     const password = fields.password[0];
     const confirmPassword = fields.confirmPassword[0];

     const {image} = files;
     const error = [];

     if(!userName){
          error.push('Please provide your user name');
     }
     if(!email){
          error.push('Please provide your Email');
     }
     if(email && !validator.isEmail(email)){
          error.push('Please provide your Valid Email');
     }
     if(!password){
          error.push('Please provide your Password');
     }
     if(!confirmPassword){
          error.push('Please provide your confirm Password');
     }
     if(password && confirmPassword && password !== confirmPassword){
          error.push('Your Password and Confirm Password not same');
     }
     if(password && password.length < 6){
          error.push('Please provide password mush be 6 charecter');
     }

     if(Object.keys(files).length === 0){
          error.push('Please provide user image');
     }

     if(error.length > 0){
          res.status(400).json({
               error:{
                    errorMessage : error
               }
          })
     } else {
          const getImageName = files.image[0].originalFilename;
          const randNumber = Math.floor(Math.random() * 99999 );
          const newImageName = randNumber + getImageName;
          files.image[0].originalFilename = newImageName;
          const newPath = path.resolve(__dirname, `../../frontend/public/user/${files.image[0].originalFilename}`);

     try {

          const checkUser = await registerModel.findOne({
               email:email
          });
          if(checkUser) {
               res.status(404).json({
                    error: {
                         errorMessage : ['Your email already exited']
                    }
               })
          }else{

               fs.copyFile(files.image[0].filepath,newPath, async(error) => {
                    if(!error) {

                         const userCreate = await registerModel.create({
                              userName,
                              email,
                              password : await bcrypt.hash(password,10),
                              image: files.image[0].originalFilename
                         });

                         const token = jwt.sign({
                              id : userCreate._id,
                              email: userCreate.email,
                              userName: userCreate.userName,
                              image: userCreate.image,
                              registerTime : userCreate.createdAt
                         }, process.env.SECRET,{
                              expiresIn: process.env.TOKEN_EXP
                         }); 

                         const options = { expires : new Date(Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000 )}

                         res.status(201).cookie('authToken',token, options).json({
                              successMessage : 'Your Register Successful',token
                         })  
                         
                    } else {
                         res.status(500).json({
                              error: {
                                   errorMessage : ['Interanl Server Error']
                              }
                         })
                    }
               })
          }

     } catch (error) {
          res.status(500).json({
               error: {
                    errorMessage : ['Interanl Server Error']
               }
          })

           } 

               
          } 
          
     }) // end Formidable  
    
}

module.exports.userLogin = async (req,res) => {
      const error = [];
      const {email,password} = req.body;
      if(!email){
          error.push('Please provide your Email');
     }
     if(!password){
          error.push('Please provide your Passowrd');
     }
     if(email && !validator.isEmail(email)){
          error.push('Please provide your Valid Email');
     }
     if(error.length > 0){
          res.status(400).json({
               error:{
                    errorMessage : error
               }
          })
     }else {

          try{
               const checkUser = await registerModel.findOne({
                    email:email
               }).select('+password');

               if(checkUser){
                    const matchPassword = await bcrypt.compare(password, checkUser.password );

                    if(matchPassword) {
                         const token = jwt.sign({
                              id : checkUser._id,
                              email: checkUser.email,
                              userName: checkUser.userName,
                              image: checkUser.image,
                              registerTime : checkUser.createdAt
                         }, process.env.SECRET,{
                              expiresIn: process.env.TOKEN_EXP
                         }); 

                         const options = { expires : new Date(Date.now() + process.env.COOKIE_EXP * 24 * 60 * 60 * 1000 )}

                         res.status(200).cookie('authToken',token, options).json({
                              successMessage : 'Your Login Successful',token
                         })

                    } else{
                         res.status(400).json({
                              error: {
                                   errorMessage : ['Your Password not Valid']
                              }
                         })
                    }
                    } else{
                         
                         res.status(400).json({
                         error: {
                              errorMessage : ['Your Email Not Found']
                         }
                    })
               }
                

          } catch{
               res.status(404).json({
                    error: {
                         errorMessage : ['Internal Sever Error']
                    }
               })

          }
     }

}

module.exports.userLogout = (req,res) => {
     res.status(200).cookie('authToken', '').json({
          success : true
     })
}