var mongoose    = require('mongoose');

var productSchema  = mongoose.Schema({
    imagePath: {
        type: String
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    department: {
        type: String
    },
    category: {
        type: String
    },
    price: {
        type: Number
    },
    color: {
        type: String
    },
    size: {
        type: String
    },
    quantity: {
        type: Number
    }
});

var Product = module.exports = mongoose.model('Product', productSchema);
module.exports.getAllProducts = function(callback){
    Product.find(callback)
}

module.exports.getProductByID = function(id, callback){
    Product.findById(id, callback);
}

module.exports.getProductByDepartment = function(department, callback){
    var query = {department: department};
    Product.find(query, callback);
}

module.exports.getProductByCategory = function(department, category, callback){
    var query = {department: department, category: category};
    Product.find(query, callback);
}