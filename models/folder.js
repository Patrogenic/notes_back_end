var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var FolderSchema = new Schema(
    {
        name: {type: String, required: true, maxlength: 100},
        description: {type: String, required: true, maxlength: 1000},
        user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    }
)

// FolderSchema.virtual('url').get(function(){
//     return '/folder/' + this._id;
// });

module.exports = mongoose.model('Folder', FolderSchema);