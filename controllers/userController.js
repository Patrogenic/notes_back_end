var User = require('../models/user');
var Folder = require('../models/folder');
var Note = require('../models/note');
var async = require('async');
var jwt = require("jsonwebtoken");
var bcrypt = require('bcryptjs');

const {body, validationResult} = require("express-validator");


//make a field for a confirmed password
exports.make_account = [
    body('username', 'Username required').trim().isLength({min: 1}).escape(),
    body('password', 'Password required').trim().isLength({min: 1}).escape(),
    body('password_confirmed', 'Password required').trim().isLength({min: 1}).escape(),

    async function(req, res, next){
        const errors = validationResult(req);

        let user = await User.findOne({username: req.body.username});

        if(user !== null){
            res.json({message: 'username is taken'})
        }else if(req.body.password.localeCompare(req.body.password_confirmed) !== 0){
            res.json({message: 'passwords differ'});
        }else{
            let user = new User({
                username: req.body.username,
                password: req.body.password,
            });
    
            if(!errors.isEmpty()){
                //there are errors, do something
                console.log('validation errors- empty fields');
                res.json(errors)
            }else{
                //data from form is valid
                bcrypt.hash(user.password, 10, (err, hashedPassword) => {
                    if(err){
                        //there is an error
                    }
                    user.password = hashedPassword;
    
                    //Save to database
                    user.save(function(err){
                        if(err){return next(err);}
                        // res.redirect('/'); // redirect to home page
                        const token = jwt.sign({user}, process.env.TOKEN_SECRET, {expiresIn: '1h'});
                        res.json({token});
                    })
                });
            }
        }
    }
]

//login the user
exports.login_post = [
    body('username', 'Username required').trim().isLength({min: 1}).escape(),
    body('password', 'Password required').trim().isLength({min: 1}).escape(),

    async function(req, res, next){

        let user = await User.findOne({username: req.body.username});

        if(user !== null){
            let match = await bcrypt.compare(req.body.password, user.password);
            
            if(match){
                const token = jwt.sign({user}, process.env.TOKEN_SECRET, {expiresIn: '1h'});
                res.json({token});
            } else {
                res.json({ message: "Invalid Credentials" });
            }
        }else{
            res.json({ message: "Invalid Credentials" });
        }
    }
]

//if I error check on these two database queries, then the code is even more indented
//so this function will need some pretty serioues reconstruction
//also, I did not do a good job on asyncronous programming (which would also help the indentings)
exports.folders_get = function(req, res){
    jwt.verify(req.token, process.env.TOKEN_SECRET, function(err, authData){
        if(err){
            res.sendStatus(403);
        }else{
            Folder.find({user: authData.user._id}).exec(function(err, folders){
                let folderData = [];
                folders.forEach(folder => {
                    Note.find({folder: folder.id}).exec(function(err, notes){
                        folderData.push({
                            'name': folder.name,
                            'description': folder.description,
                            '_id': folder.id,
                            'notes': notes,
                        });
                        if(folders.length === folderData.length){
                            return res.json({folderData})
                        }
                    })
                })
            })
        }
    })
}

exports.folder_post = [
    body('name', 'Name required').trim().isLength({min: 1}).escape(),
    body('description', 'Description required').trim().isLength({}).escape(),

    function(req, res, next){
        jwt.verify(req.token, process.env.TOKEN_SECRET, function(err, authData){
            if(err){
                res.sendStatus(403);
            }else{
                const errors = validationResult(req);
                let folder = new Folder({
                    name: req.body.name,
                    description: req.body.description,
                    user: authData.user._id,
                })
        
                if(!errors.isEmpty()){
                    //there are errors, do something
                    console.log('validation errors- empty fields');
                    res.json(errors)
                }else{
                    //data from form is valid
                    if(err){
                        //there is an error
                    }
                    //Save to database
                    folder.save(function(err){
                        if(err){return next(err);}
                        res.json(folder);
                    })
                }
            }
        })
    }
]
exports.folder_put = [
    body('name', 'Name required').trim().isLength({min: 1}).escape(),
    body('description', 'Description required').trim().isLength({}).escape(),

    function(req, res, next){
        jwt.verify(req.token, process.env.TOKEN_SECRET, function(err, authData){
            if(err){
                res.sendStatus(403);
            }else{
                const errors = validationResult(req);
                let folder = {
                    name: req.body.name,
                    description: req.body.description,
                }
        
                if(!errors.isEmpty()){
                    //there are errors, do something
                    console.log('validation errors- empty fields');
                    res.json(errors)
                }else{
                    //data from form is valid
                    if(err){
                        //there is an error
                    }
                    //update database
                    Folder.findByIdAndUpdate(req.params.id, folder, {new: true}, function(err, theFolder){
                        res.json(theFolder)
                    })
                }
            }
        })
    }
]
exports.folder_delete = function(req, res){
    jwt.verify(req.token, process.env.TOKEN_SECRET, function(err, authData){
        if(err){
            res.sendStatus(403);
        }else{
            async.parallel({
                folder: function(callback){
                    Folder.findById(req.params.id).exec(callback);
                },
                notes: function(callback){
                    Note.find({'folder': req.params.id}).exec(callback);
                },
            }, function(err, results){
                if(err){return next(err);}
                results.notes.forEach(note => {
                    Note.findByIdAndDelete(note.id, function deleteNote(err){
                        if(err){return next(err);}
                    })
                });
                Folder.findByIdAndDelete(req.params.id, function deleteFolder(err){
                    if(err){return next(err);}
                    
                    res.json({message: 'success'});
                })
            })
        }
    })
}

exports.note_post = [
    body('name', 'Name required').trim().isLength({min: 1}).escape(),
    body('description', 'Description required').trim().isLength({min: 1}).escape(),

    function(req, res, next){
        jwt.verify(req.token, process.env.TOKEN_SECRET, function(err, authData){
            if(err){
                res.sendStatus(403);
            }else{
                const errors = validationResult(req);
                let note = new Note({
                    name: req.body.name,
                    description: req.body.description,
                    folder: req.params.id,
                })
        
                if(!errors.isEmpty()){
                    //there are errors, do something
                    console.log('validation errors- empty fields');
                    res.json(errors)
                }else{
                    //data from form is valid
                    if(err){
                        //there is an error
                    }
                    //Save to database
                    note.save(function(err){
                        if(err){return next(err);}
                        res.json(note);
                    })
                }
            }
        })
    }
]
exports.note_put = [
    body('name', 'Name required').trim().isLength({min: 1}).escape(),
    body('description', 'Description required').trim().isLength({min: 1}).escape(),

    function(req, res, next){
        jwt.verify(req.token, process.env.TOKEN_SECRET, function(err, authData){
            if(err){
                res.sendStatus(403);
            }else{
                const errors = validationResult(req);
                let note = {
                    name: req.body.name,
                    description: req.body.description,
                }
        
                if(!errors.isEmpty()){
                    //there are errors, do something
                    console.log('validation errors- empty fields');
                    res.json(errors)
                }else{
                    //data from form is valid
                    if(err){
                        //there is an error
                    }
                    //update database
                    Note.findByIdAndUpdate(req.params.id, note, {new: true}, function(err, theNote){
                        res.json(theNote)
                    })
                }
            }
        })
    }
]
exports.note_delete = function(req, res){
    jwt.verify(req.token, process.env.TOKEN_SECRET, function(err, authData){
        if(err){
            res.sendStatus(403);
        }else{
            Note.findByIdAndDelete(req.params.id, function deleteNote(err, note){
                if(err){return next(err);}

                res.json({message: 'success'})
            })
        }
    });
}

//FORMT OF TOKEN:
//Authorization: Bearer <access_token>
exports.verify_token = function(req, res, next){
    //get auth header value
    const bearerHeader = req.headers['authorization'];
    //check if bearer is undefined
    if(typeof bearerHeader !== 'undefined'){
        // split at the space
        const bearer = bearerHeader.split(' ');
        //get token from array
        const bearerToken = bearer[1];
        //set the token
        req.token = bearerToken;
    
        next();
    }else{
        //forbidden
        res.sendStatus(403);
    }
}

// exports.verify_token = verify_token;