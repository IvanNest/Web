var mongoose    = require('mongoose');

var orderSchema  = mongoose.Schema({
    orderID: {
        type    : String,
        index   : true
    },
    username: {
        type    : String
    },
    address: {
        type    : String
    },
    orderDate: {
        type    : String
    },
    shipping: {
        type    : Boolean
    },
    total: {
        type    : Number
    }
});

var Order = module.exports = mongoose.model('Order', orderSchema);
module.exports.getAllOrders = function(callback){
    Order.find(callback)
}