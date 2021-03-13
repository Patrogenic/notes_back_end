var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var NoteSchema = new Schema(
    {
        name: {type: String, required: true, maxlength: 100},
        description: {type: String, required: true, maxlength: 10000},
        folder: {type: Schema.Types.ObjectId, ref: 'Folder', required: true},
    }
)

// NoteSchema.virtual('url').get(function(){
//     return '/note/' + this._id;
// });

module.exports = mongoose.model('Note', NoteSchema);