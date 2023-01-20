var mongoose    = require('mongoose');

var VSchema  = mongoose.Schema({
    productID: {
        type: String
    },
    imagePath: {
        type: String
    },
    color: {
        type: String
    },
    size: {
        type: String
    },
    quantity: {
        type: Number
    },
    title: {
        type: String
    },
    price: {
        type: Number
    }
});

var V = module.exports = mongoose.model('V', VSchema);

module.exports.getVByID = function(id, callback){
    V.findById(id, callback);
}

module.exports.getVProductByID = function(id, callback){
    var query = {productID: id};
    V.find(query, callback);
}
module.exports.getAllVs = function(callback){
    V.find(callback)
}