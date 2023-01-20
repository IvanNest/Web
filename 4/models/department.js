var mongoose    = require('mongoose');

var departmentSchema  = mongoose.Schema({
    departmentName: {
        type: String,
        index   : true
    },
    categories:{
        type: String
    }
});

var Department = module.exports = mongoose.model('Department', departmentSchema);
module.exports.getAllDepartments = function(callback){
    Department.find(callback)
}
module.exports.getDepartmentById = function(id, callback){
    Department.findById(id, callback);
}