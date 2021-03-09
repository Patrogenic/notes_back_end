var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//might make it so the user verifies password on creation
router.post('/api/make_account', userController.make_account);

router.post('/api/login', userController.login_post);

//get all notes data for the user
router.get('/api/folders', userController.verify_token, userController.folders_get);

// //create new folder
router.post('/api/folder', userController.verify_token, userController.folder_post);
// //update name or description of the folder
router.put('/api/folder/:id', userController.verify_token, userController.folder_put);
// //delete folder
router.delete('/api/folder/:id', userController.verify_token, userController.folder_delete);

// //create new note
router.post('/api/folder/:id/note', userController.verify_token, userController.note_post);
// //update contents of the note
router.put('/api/folder/note/:id', userController.verify_token, userController.note_put);
// //delete note
router.delete('/api/folder/note/:id', userController.verify_token, userController.note_delete);





module.exports = router;
