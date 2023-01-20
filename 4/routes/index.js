var quick       = require('quick');
var router        = quick.Router();
var Product       = require('../models/product');
var V       = require('../models/V');
var Cart          = require('../models/cart');
var Order         = require('../models/order');
var Department    = require('../models/department');


router.get('/', init, function(req, res, next)
{
  Product.getAllProducts(function(e, products)
  {
    if (e)
    {
      console.log("Failed on router.get('/')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      console.log("products: ", products)
      res.render('index', {title: 'Home', products: products, pageName: 'All products'});
    }
  });
});


router.get('/product-overview/:id', init, function(req, res, next)
{
  let productId = req.params.id;
  Product.getProductByID(productId, function(e, item)
  {
    if (e)
    {
      console.log("Failed on router.get('/dashboard')\nError:".error, e.message.error + "\n")
      e.status = 404; next(e);
    }
    else
    {
      V.getVProductByID(productId, function(e, Vs){
        // The course does not cover registerhelpers so I am sending information manually.
        let qty;
        if (item.quantity < 1) { qty = false} else{qty = true}
        
        res.render('productOverview', { title: item.title, product: item, Vs: Vs, qty: qty});
      })
    }
  });
});

/////////////////////////////////////////////////////////////////////
//
// MIDDLEWARE - Handles GET requests to the product list page for
// department and category
//
// Renders index.hbs with available data from database 
//
/////////////////////////////////////////////////////////////////////
router.get('/product-list/:department/:category', init, function(req, res, next)
{
  let aDepartment = req.params.department;
  let aCategory = req.params.category;
  Product.getProductByCategory(aDepartment, aCategory, function(e, products)
  {
    if (e)
    {
      console.log("Failed on router.get('/')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      res.render('index', {title: 'Home', products: products, pageName: aDepartment + ' ' + aCategory});
    }
  });
});

/////////////////////////////////////////////////////////////////////
//
// MIDDLEWARE - Handles GET requests to the product list page for
// department
//
// Renders index.hbs with available data from database 
//
/////////////////////////////////////////////////////////////////////
router.get('/product-list/:department', init, function(req, res, next)
{
  let aDepartment = req.params.department;
  Product.getProductByDepartment(aDepartment, function(e, products)
  {
    if (e)
    {
      console.log("Failed on router.get('/')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      res.render('index', {title: 'Home', products: products, pageName: aDepartment + ' products'});
    }
  });
});

/////////////////////////////////////////////////////////////////////
//
// MIDDLEWARE - Handles GET requests to the add to shopping bag
// adds selected item to the bag
//
/////////////////////////////////////////////////////////////////////
router.get('/add-to-bag/:id', init, function(req, res, next){
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

          if (req.user)
          {
            cart.userId = req.user._id;
          }
          req.session.cart = cart;

          res.redirect('/');
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
                res.redirect('/');
              })
            }
          })
        }
      }
    })
});

/////////////////////////////////////////////////////////////////////
//
// Decreases the number of selected item in the shopping bag
//
/////////////////////////////////////////////////////////////////////
router.get('/decrease/:id', init, function(req,res, next){
  let productId = req.params.id;
  let cart = new Cart(req.session.cart);

  cart.decreaseQty(productId);
  req.session.cart = cart;
  res.redirect('/shopping-bag');

});

/////////////////////////////////////////////////////////////////////
//
// Increases the number of selected item in the shopping bag
//
/////////////////////////////////////////////////////////////////////
router.get('/increase/:id', init, function(req,res, next){
  let productId = req.params.id;
  let cart = new Cart(req.session.cart);

  Product.findById(productId, function(e, product){
    if (product)
    {
      if(cart.items[productId].qty + 1 > product.quantity)
      {
        req.flash('error_msg', 'Not eneough inventory');
        res.redirect('/shopping-bag');
      }
      else
      {
        cart.increaseQty(productId);
        req.session.cart = cart;
        res.redirect('/shopping-bag');
      }
    }
    else
    {
      V.findById(productId, function(e, V){
        if(cart.items[productId].qty + 1 > V.quantity)
        {
          req.flash('error_msg', 'Not eneough inventory');
          res.redirect('/shopping-bag');
        }
        else
        {
          cart.increaseQty(productId);
          req.session.cart = cart;
          res.redirect('/shopping-bag');
        }
      })
    }
  })
});

/////////////////////////////////////////////////////////////////////
//
// MIDDLEWARE - Handles GET requests to the shopping page
//
// Renders shoppingBag.hbs with available data from database 
//
/////////////////////////////////////////////////////////////////////
router.get('/shopping-bag', init, function(req, res, next){
  if (!req.session.cart)
  {
    res.render('shoppingBag', {items: null, containerWrapper: 'container'});
  }
  else
  {
    let cart = new Cart(req.session.cart ? req.session.cart : {});
    res.render('shoppingBag', {items: cart.generateArray(), SumP: cart.SumP, containerWrapper: 'container'})
  }
});

router.get('/order-history', init, ensureAuthenticated, function(req, res, next){
  Order.find({"username": req.user.username }, function(e, order)
  {
    if (e)
    {
      console.log("Failed on router.get('/order-history')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
      
    }
    else
    {
      res.render('orderHistory', { title: 'Products', orders: order})
    }
  });
});


router.post('/search', function(req, res, next){
  let query = toTitleCase(req.body.query)
  if (query.includes(","))
  {
    query = query.split(",");
    for (i = 0; i < query.length; i++){
      query[i] = new RegExp(escapeRegex(query[i]), 'gi');
    }
    Product.find({title: {$in: query}}, function(e, item)
    {
      if (e)
      {
        console.log("Failed on router.post('/search')\nError:".error, e.message.error + "\n")
        e.status = 406; next(e);
      }
      else
      {
        if (item.length <= 0)
        {
          Product.find({category: {$in: query}}, function(e, categoryItem)
          {
            query = cleanQuery(query)
            res.render('search', { products: categoryItem, title: 'Search Page', searchKeywords: query});
          })
        }
        else
        {
          query = cleanQuery(query)
          res.render('search', { products: item, title: 'Search Page', searchKeywords: query});
        }
        
      }
    });
  }
  else
  {
    Product.find({title: {$regex: new RegExp(query)}}, function(e, item)
    {
      if (e)
      {
        console.log("Failed on router.post('/search')\nError:".error, e.message.error + "\n")
        e.status = 406; next(e);
      }
      else
      {
        if (item.length <= 0)
        {
          Product.find({category: {$regex: new RegExp(query)}}, function(e, categoryItem)
          {
            res.render('search', { products: categoryItem, title: 'Search Page', searchKeywords: query});
          })
        }
        else
        {
          res.render('search', { products: item, title: 'Search Page', searchKeywords: query});
        }
        
      }
    });
  }
});

router.get('/search', init, function(req, res, next){
  if (req.query.query == undefined)
  {
    res.redirect('/')
  }
  else
  {
    let query = toTitleCase(req.query.query)
    if (query.includes(","))
    {
      query = query.split(",");
      for (i = 0; i < query.length; i++){
        query[i] = new RegExp(escapeRegex(query[i]), 'gi');
      }
      Product.find({title: {$in: query}}, function(e, item)
      {
        if (e)
        {
          console.log("Failed on router.post('/search')\nError:".error, e.message.error + "\n")
          e.status = 406; next(e);
        }
        else
        {
          if (item.length <= 0)
          {
            Product.find({category: {$in: query}}, function(e, categoryItem)
            {
              query = cleanQuery(query)
              res.render('search', { products: categoryItem, title: 'Search Page', searchKeywords: query});
            })
          }
          else
          {
            query = cleanQuery(query)
            res.render('search', { products: item, title: 'Search Page', searchKeywords: query});
          }
        }
      });
    }
    else
    {
      Product.find({title: {$regex: new RegExp(query)}}, function(e, item)
      {
        if (e)
        {
          console.log("Failed on router.post('/search')\nError:".error, e.message.error + "\n")
          e.status = 406; next(e);
        }
        else
        {
          if (item.length <= 0)
          {
            Product.find({category: {$regex: new RegExp(query)}}, function(e, categoryItem)
            {
              res.render('search', { products: categoryItem, title: 'Search Page', searchKeywords: query});
            })
          }
          else
          {
            res.render('search', { products: item, title: 'Search Page', searchKeywords: query});
          }
        }
      });
    }
  }
  
});

router.get('/presearch', init, function(req,res,next){  
  let query = toTitleCase(req.query.q)
  
  if (query.includes(","))
  {
    query = query.split(",");
    for (i = 0; i < query.length; i++){
      query[i] = new RegExp(escapeRegex(query[i]), 'gi');
    }
    Product.find({ "title": {$in: query} }, function(e, data){
      if(e) {
        console.log(e);
      }
      else{
        if (data.length <= 0){
          Product.find({category: {$in: query}}, function(err, categoryData) {
              res.json(categoryData)
          }).limit(8);
        }
        else{
          res.json(data)
        }
      }
    }).limit(8);
  }
  else
  {
    Product.find({title: {$regex: new RegExp(query)}}, function(e, data) {
      if (e){
          console.log(e)
      }
      else{
        if (data.length <= 0){
          Product.find({category: {$regex: new RegExp(query)}}, function(err, categoryData) {
              res.json(categoryData)
          }).limit(8)
        }
        else{
          res.json(data)
        }
      } 
    }).limit(5)
  }
});

router.post('/filters', init, function(req, res, next){
  let low   = req.body.lowPrice;
  let high  = req.body.highPrice
  if (low === "on" && high == undefined)
  {
    Product.find({ "price": {$lt:30} }, function(e, items){
      if (e)
      {
        console.log("Failed on router.post('/filters')\nError:".error, e.message.error + "\n")
        e.status = 406; next(e);
      }
      else
      {
        res.render('index', { title: 'Products', products: items});
      }
    });
  }
  else if(low == undefined && high === "on"){
    Product.find({ "price": {$gte:30} }, function(e, items){
      if (e)
      {
        console.log("Failed on router.post('/filters')\nError:".error, e.message.error + "\n")
        e.status = 406; next(e);
      }
      else
      {
        res.render('index', { title: 'Products', products: items});
      }
    });
  }
  else{
    res.redirect('/')
  }
  
});


function ensureAuthenticated(req, res, next){
  if (req.isAuthenticated())
  {
    Department.getAllDepartments(function(e, departments)
    {
      req.session.department = JSON.stringify(departments)
      return next();
    })
  }
  else{
    //req.flash('error_msg', 'You are not logged in');
    res.redirect('/users/login');
  }
};


function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

function cleanQuery(array) {
  for (let i = 0; i < array.length; i++)
  {
    if (array[i].toString().includes("/gi"))array[i] = array[i].toString().replace("/gi", "");
    array[i] = array[i].toString().replace(/[/\\]/g, "");
  }
  return array;
};

function toTitleCase(arg)
{
    return arg.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function init(req, res, next)
{
    Department.getAllDepartments(function(e, departments)
    {
        req.session.department = JSON.stringify(departments)
        return next();
    })
}

module.exports = router;