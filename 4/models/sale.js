var mongoose    = require('mongoose');

var SaleSchema  = mongoose.Schema({
    code: {
        type: String
    },
    description: {
        type: String
    },
    percentage: {
        type: Number
    }
});

var Sale = module.exports = mongoose.model('Sale', SaleSchema);
module.exports.getAllSales = function(callback){
    Sale.find(callback)
}

module.exports.getSaleByCode = function(SaleCode, callback){
    var query = {code: SaleCode};
    Sale.findOne(query, callback);
}