var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UserSchema = new Schema(
    {
        username: {type: String, required: true, maxlength: 50},
        password: {type: String, required: true, maxlength: 100},
    }
)

// UserSchema.virtual('url').get(function(){
//     return '/users/' + this._id;
// });

module.exports = mongoose.model('User', UserSchema);