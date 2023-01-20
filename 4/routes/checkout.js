var quick                 = require('quick');
var router                  = quick.Router();
var pp                  = require('pp-rest-sdk');
var Cart                    = require('../models/cart');
var Product                 = require('../models/product');
var V                 = require('../models/V');
var Order                   = require('../models/order');
var Department              = require('../models/department');
var Sale                = require('../models/Sale');


/////////////////////////////////////////////////////////////////////
//
// MIDDLEWARE - Handles GET requests to the checkout page
//
// This basically renders checkout page and set the Sale price
// to 0 always.
//
/////////////////////////////////////////////////////////////////////
router.get('/', ensureAuthenticatedInCheckout, function(req, res, next){
    let cart = new Cart(req.session.cart);
    req.session.cart.SalePrice = 0;
    res.render('checkout', {title: 'Checkout Page', items: cart.generateArray(), SumP: cart.SumP, bodyClass: 'registration', containerWrapper: 'container'});
})

router.get('/pay', ensureAuthenticated, function(req, res, next){
    let cart = new Cart(req.session.cart);
    req.session.cart.SalePrice = 0;
    res.render('checkout', {title: 'Checkout Page', items: cart.generateArray(), SumP: cart.SumP, bodyClass: 'registration', containerWrapper: 'container'});
})

/////////////////////////////////////////////////////////////////////
//
// MIDDLEWARE - Handles GET requests for adding Sale
//
// This basically rediercts to checkout page. I need this because
// I in the post request for apply Sale I am rendering another page
// so '/apply-Sale' keeps in the address bar. Therefore I just
// created redirect middleware for that reason.
//
/////////////////////////////////////////////////////////////////////
router.get('/apply-Sale', ensureAuthenticated, function(req, res, next){
    res.redirect('/checkout')
})

/////////////////////////////////////////////////////////////////////
//
// MIDDLEWARE - Handles POST requests for adding Sale
//
// Checks for the Sale codes and if it is applicable then returns
// Saleed price.
//
/////////////////////////////////////////////////////////////////////
router.post('/apply-Sale', ensureAuthenticated, function(req, res, next){
    let SaleCode = req.body.SaleCode; 
    Sale.getSaleByCode(SaleCode, function(e, Sale)
    {
        if (e)
        {
            console.log("Failed on router.get('/checkout/apply-Sale')\nError:".error, e.message.error + "\n")
            e.status = 406; next(e);
        }
        else
        {
            let cart = new Cart(req.session.cart);
            if (Sale)
            {
                let totalSale = (cart.SumP * Sale.percentage) / 100
                totalSale = parseFloat(totalSale.toFixed(2))
                let SumP = cart.SumP - totalSale;
                SumP = parseFloat(SumP.toFixed(2))
                cart.SalePrice = SumP
                req.session.cart = cart;
                console.log(req.session.cart)
                res.render('checkout', {title: 'Checkout Page', items: cart.generateArray(), SumPAfterSale: SumP, totalSale: totalSale, actualPrice: cart.SumP, SalePercentage: Sale.percentage, bodyClass: 'registration', containerWrapper: 'container'});
            }
            else
            {
                cart.SalePrice = 0;
                req.session.cart = cart;
                console.log(req.session.cart)
                res.render('checkout', {title: 'Checkout Page', items: cart.generateArray(), SumP: cart.SumP, SaleCode: SaleCode, bodyClass: 'registration', containerWrapper: 'container', msg: "This Sale code is not applicable"});
            }
        }
    })
})

/////////////////////////////////////////////////////////////////////
//
// checkout-process - checkout-success - checkout-cancel
// MIDDLEWARE - Handles POST & GET requests
//
// They are just middleware for pp API. Nothing special about them
// Derived from https://github.com/pp/pp-node-SDK
//
/////////////////////////////////////////////////////////////////////
router.post('/checkout-process', function(req, res){
    const url = `${req.protocol}://${req.headers.host}`;
    let cart = new Cart(req.session.cart);
    let SumP = (req.session.cart.SalePrice > 0) ? req.session.cart.SalePrice : cart.SumP;
    // Create payment json starts
    let create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "pp"
        },
        "redirect_urls": {
            "return_url": `${url}/checkout/checkout-success`,
            "cancel_url": `${url}//checkout/checkout-cancel`
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": 'Buying products from yard & garage',
                    "sku": "001",
                    "price": SumP,
                    "currency": "CAD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "CAD",
                "total": SumP
            },
            "description": "Thank you for purchising"
        }]
    };
    pp.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            console.log("Error occured: ", error);
            res.redirect('error')
        } else {
            for (var i = 0; i < payment.links.length; i++){
            if(payment.links[i].rel === 'approval_url'){
                res.redirect(payment.links[i].href);
            }
            }
        }
    });
});

router.get('/checkout-success', ensureAuthenticated, function(req, res){
    let cart = new Cart(req.session.cart);
    let SumP = (req.session.cart.SalePrice > 0) ? req.session.cart.SalePrice : cart.SumP;
    const payerID = req.query.PayerID;
    const paymentID = req.query.paymentId;

    let execute_payment_json = {
        "payer_id": payerID,
        "transactions" : [{
        "amount": {
            "currency": "CAD",
            "total": SumP
        }
        }]
    };

    pp.payment.execute(paymentID, execute_payment_json, function(error, payment){
        if(error) {
            console.log("ERROR: \n", error.response);
            res.redirect('error')
        }
        else{
            let address    = payment.payer.payer_info.shipping_address;
            let paymentInformation  = payment.transactions[0].related_resources[0].sale;
            let userAddress = address.line1 + " " + address.line2 + " " + address.city + " " + address.state + " " + address.country_code + " " + address.postal_code;
            
            // Insert payment to payment table
            let newOrder = new Order({
                orderID             : paymentInformation.id,
                username            : req.user.username,
                address             : userAddress,
                orderDate           : payment.create_time,
                shipping            : true,
                total               : payment.transactions[0].amount.total
              });
            newOrder.save();
            let cartItems = cart.items

            decreaseInventory(cartItems, function(c)
            {
                if (c)
                {
                    req.session.cart = null;
                    res.render('checkoutSuccess', {title: 'Successful', containerWrapper: 'container'});
                }
            })

            

            
        }
    });
});

router.get('/checkout-cancel', ensureAuthenticated, function(req, res){
    res.render('checkoutCancel', {title: 'Successful', containerWrapper: 'container'});
});
router.get('/buy-now/:id', ensureAuthenticated, function(req, res, next){
    let productId = req.params.id;
    let cart = new Cart(req.session.cart ? req.session.cart : {});
    Product.findById(productId, function(e, product){
      if (e)
      {
        console.log("Failed on router.get('/add-to-bag/:id')\nError:".error, e.message.error + "\n")
        e.status = 406; next(e);
      }
      else
      {
        if (product)
        {
            cart.add(product, product.id);
            cart.userId = req.user._id;
            req.session.cart = cart;
            res.render('checkout', {title: 'Checkout Page', items: cart.generateArray(), SumP: cart.SumP, bodyClass: 'registration', containerWrapper: 'container'});
        }
        else
        {
          V.findById(productId, function(e, V){
            if (e)
            {
              console.log("Failed on router.get('/add-to-bag/:id')\nError:".error, e.message.error + "\n")
              e.status = 406; next(e);
            }
            else
            {
              Product.findById(V.productID, function(e, p){
                let color = (V.color) ? "- " + V.color : "";
                V.title = p.title + " " + color
                V.price = p.price
                cart.add(V, V.id);
                req.session.cart = cart;
                res.render('checkout', {title: 'Checkout Page', items: cart.generateArray(), SumP: cart.SumP, bodyClass: 'registration', containerWrapper: 'container'});
              })
            }
          })
        }
      }
    })
});

function decreaseInventory(cartItems, callback)
{
    for (let item in cartItems)
    {
        let qty = cartItems[item].qty;
        Product.getProductByID(item, function(e, p)
        {
            if (p)
            {
                Product.findOneAndUpdate({"_id": item}, 
                { $set: {
                    "quantity"    : p.quantity - qty,
                    }
                },
                { new: true }, function(e, result){
                    
                });
            }
            else
            {
                V.getVByID(item, function(e, v)
                {
                    V.findOneAndUpdate({"_id": item}, 
                    { $set: {
                        "quantity"    : v.quantity - qty,
                        }
                    },
                    { new: true }, function(e, result){
                        
                    });
                });
            }
        });
    }

    return callback(true)
}


function ensureAuthenticated(req, res, next){
    req.session.redirectToCheckout = false;
    if (req.isAuthenticated())
    {
        console.log("Authenticated user");
        return next();
    }
    else
    {
        req.flash('error_msg', 'You are not logged in');
        res.redirect('/users/login');
    }
};


function ensureAuthenticatedInCheckout(req, res, next){
    req.session.redirectToCheckout = true;
    
    if (req.isAuthenticated())
    {
        console.log("Authenticated user");
        return next();
    }
    else
    {
        req.flash('error_msg', 'You are not logged in');
        res.redirect('/users/login');
    }
};

module.exports = router;