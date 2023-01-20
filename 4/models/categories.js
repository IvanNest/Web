var mongoose    = require('mongoose');

var categorySchema  = mongoose.Schema({
    categoryName: {
        type: String,
        index   : true
    }
});

var Category = module.exports = mongoose.model('Categories', categorySchema);

// These are functions to get data from the database. You can even reach the information
// without calling this functions but I just want to show you how you can add some functions
// to your model file to get specific data.

module.exports.getAllCategories = function(callback){
    Category.find(callback)
}

module.exports.getCategoryById = function(id, callback){
    Category.findById(id, callback);
}