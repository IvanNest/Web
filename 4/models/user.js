var mongoose    = require('mongoose');
var bcrypt      = require('bcryptjs');

var userSchema  = mongoose.Schema({
    username: {
        type    : String,
        index   : true
    },
    password: {
        type    : String
    },
    fullname: {
        type    : String
    },
    admin: {
        type    : String
    },
    cart: {
        type    : Object
    }
});

var User = module.exports = mongoose.model('User', userSchema);
module.exports.createUser = function(newUser, callback){
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}

module.exports.getUserByUsername = function(username, callback){
    var q = {username: username};
    User.findOne(q, callback);
}

module.exports.getUserById = function(id, callback){
    User.findById(id, callback);
}
module.exports.comparePassword = function(givenPassword, hash, callback){
    bcrypt.compare(givenPassword, hash, function(err, isMatch) {
        if(err) throw err;
        callback(null, isMatch);
    });
}

module.exports.getAllUsers = function(callback){
    User.find(callback)
}