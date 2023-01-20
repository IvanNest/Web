var quick       = require('quick');
var router        = quick.Router();
var Product       = require('../models/product');
var V       = require('../models/V');
var Sale      = require('../models/Sale');
var Department    = require('../models/department');
var Category      = require('../models/categories');
var User          = require('../models/user');
var Order         = require('../models/order');
var multer        = require('multer');


var storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: function (req, file, callback)
  {
    callback(null, Date.now() + '-' + file.originalname);
  }
});

var fileFilter = function(req, file, callback){
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg')
  {
    callback(null, true);
  }
  else
  {
    callback(null, false);
  }    
};

var upload = multer({ 
  storage: storage,
  limits: {fileSize: 1024 * 1024 * 10},
  fileFilter: fileFilter
}).single('productImage');

router.post('/image-upload', function(req, res)
{
  upload(req, res, function(err) 
  {
      if (err) 
      {
          return res.end("Error uploading file.");
      }
      if (req.file)
      {
          res.send(req.file);
      }
      else
      {
          console.log("Failed on router.get('/image-upload')\nError:".error, err + "\n")
          res.send(err);
      }
  });
});


router.get('/', ensureAuthenticated, ensureAdmin, function(req, res, next)
{
  res.render('dashboard', {title: 'Dashboard'});
});


router.get('/inventory', ensureAuthenticated, ensureAdmin, function(req, res, next)
{
  Product.getAllProducts(function(e, products)
  {
    if (e)
    {
      console.log("Failed on router.get('/inventory')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      checkVs(products, function(data)
      {
        res.render('inventory', {title: 'Inventory', products: data});
      })
      
    }
  });
});

function checkVs(products, callback)
{
  for (let i = 0; i < products.length; i++)
  {
    V.getVProductByID(products[i]._id, function(e, Vs){
      if (Vs.length > 0)
      {
        products[i]["V"] = Vs.length
      }
    })
  }
  callback(products)
}

router.get('/insert-inventory', ensureAuthenticated, ensureAdmin, function(req, res, next){
  Department.getAllDepartments(function(e, departments)
  {
    if (e)
    {
      console.log("Failed on router.get('/dashboard/update')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      res.render('insertInventory', {title: 'Insert Inventory', departments: departments})
    }
  });
});

router.post('/insert-inventory', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let sizes = (req.body.size) ? req.body.size.toString() : ""
  let department = (req.body.department) ? req.body.department.toString() : ""
  let category = (req.body.category) ? req.body.category.toString() : ""
  let title = toTitleCase(req.body.title)

  let product = new Product({
    imagePath   : req.body.imagePath,
    title       : title,
    description : req.body.description,
    price       : req.body.price,
    color       : req.body.color,
    size        : sizes,
    quantity    : req.body.quantity,
    department  : department,
    category    : category
  });
  product.save();
  req.flash('success_msg', 'A new product successfully added to database');
  res.redirect('/dashboard/inventory');
});

router.get('/update-inventory/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let productId = req.params.id;
  Product.findOne({ "_id": productId }, function(e, item){
    if (e)
    {
      console.log("Failed on router.get('/dashboard/update')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else 
    {
      V.getVProductByID(productId, function(e, Vs){
        Department.getAllDepartments(function(e, departments)
        {
          res.render('updateProduct', {title: 'Update product', product: item, Vs: Vs, departments: departments});
        });
      })
    }
  });
});

router.post('/update-inventory/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let productId = req.params.id;
  let sizes = (req.body.size) ? req.body.size.toString() : ""
  let department = (req.body.department) ? req.body.department.toString() : ""
  let category = (req.body.category) ? req.body.category.toString() : ""
  let title = toTitleCase(req.body.title)

  Product.findOneAndUpdate({"_id": productId}, 
  { $set: {
    "imagePath"   : req.body.imagePath,
    "title"       : title,
    "description" : req.body.description,
    "price"       : req.body.price,
    "color"       : req.body.color,
    "size"        : sizes,
    "quantity"    : req.body.quantity,
    "department"  : department,
    "category"    : category
    }
  },
  { new: true }, function(e, result){
    if (e)
    {
      console.log("Failed on router.post('/dashboard/update-inventory/')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else {
      req.flash('success_msg', 'Product updated!');
      res.redirect('/dashboard/inventory');
    }
  });
  
});

router.get('/delete-inventory/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let productId = req.params.id;
  V.find({"productID": productId}, function(e, Vs)
  {
    if (e)
    {
      console.log("Failed on router.get('/dashboard/delete-V')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      for (let i = Vs.length - 1; i > -1; i--)
      {
        V.deleteOne({ "_id": Vs[i]._id }, function(e, result){
          if (e)
          {
            console.log("Failed on router.get('/dashboard/delete-V')\nError:".error, e.message.error + "\n")
            e.status = 406; next(e);
          }
        });
      }
      Product.deleteOne({ "_id": productId }, function(e, result){
        if (e)
        {
          console.log("Failed on router.get('/delete')\nError:".error, e.message.error + "\n")
          e.status = 406; next(e);
        }
        else
        {
          req.flash('success_msg', 'A product successfully deleted from database');
          res.redirect('/dashboard/inventory');
        }
      });
    }
  })
});



// GET request for getting add V page
router.get('/add-V/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let productId = req.params.id;
  Product.findById(productId, function(e, product){
    if (e)
    {
      console.log("Failed on router.get('/dashboard/add-V')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      V.getVProductByID(productId, function(e, Vs){
        if (e)
        {
          console.log("Failed on router.get('/dashboard/update')\nError:".error, e.message.error + "\n")
          e.status = 406; next(e);
        }
        else
        {
          res.render('insertV', {title: 'Add V', product: product, Vs: Vs})
        }
      })
      
    }
  })
});

router.post('/add-V/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let productID = req.params.id;
  let sizes = (req.body.size) ? req.body.size.toString() : ""

  let V = new V({
    productID   : productID,
    imagePath   : req.body.imagePath,
    color       : req.body.color,
    size        : sizes,
    quantity    : req.body.quantity
  });
  V.save();
  req.flash('success_msg', 'A new V successfully added to product');
  res.redirect('/dashboard/inventory');
});

router.get('/update-V/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let VId = req.params.id;
  V.findOne({ "_id": VId }, function(e, V){
    if(e)
    {
      console.log("Failed on router.get('/update-V/:id')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else 
    {
      Product.findOne({ "_id": V.productID }, function(e, product){
        if(e)
        {
          console.log("Failed on router.get('/update-V/:id') product findOne\nError:".error, e.message.error + "\n")
          e.status = 406; next(e);
        }
        else 
        {
          res.render('updateV', {title: 'Update V', V: V, product: product});
        }
      })
    }
  });
});

router.post('/update-V/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let VID = req.params.id;
  let sizes = (req.body.size) ? req.body.size.toString() : ""

  V.findOneAndUpdate({"_id": VID}, 
  { $set: {
    "imagePath"   : req.body.imagePath,
    "color"       : req.body.color,
    "size"        : sizes,
    "quantity"    : req.body.quantity
    }
  },
  { new: true }, function(e, result){
    if(e) {
      console.log("Failed on router.get('/update-V/:id')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    } else {
      req.flash('success_msg', 'V updated!');
      res.redirect('/dashboard/inventory');
    }
  });
  
});

router.get('/delete-V/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let VId = req.params.id;
  V.deleteOne({ "_id": VId }, function(e, result){
    if (e)
    {
      console.log("Failed on router.get('/dashboard/delete-V')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else {
      req.flash('success_msg', 'A V successfully deleted from database');
      res.redirect('/dashboard/inventory');
    }
  });
});

router.get('/departments', ensureAuthenticated, ensureAdmin, function(req, res, next)
{
  Department.getAllDepartments(function(e, departments)
  {
    if (e)
    {
      console.log("Failed on router.get('/inventory')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      res.render('departments', {title: 'Departments', departments: departments});
    }
  });
});

router.get('/insert-department', ensureAuthenticated, ensureAdmin, function(req,res, next){
  Category.getAllCategories(function(e, categories)
  {
    if (e)
    {
      console.log("Failed on router.get('/inventory')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      res.render('insertDepartment', {title: 'Insert Department', categories: categories});
    }
  });
});

router.post('/insert-department', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let name = toTitleCase(req.body.departmentName)
  let department = new Department({
    departmentName  : name,
    categories      : req.body.categoryName
  });
  department.save();
  req.flash('success_msg', 'New department successfully added to database');
  res.redirect('/dashboard/departments');
});

router.get('/update-department/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let departmentID = req.params.id;
  Department.findOne({ "_id": departmentID }, function(e, department){
    if (e)
    {
      console.log("Failed on router.get('/dashboard/update-department')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else 
    {
      Category.getAllCategories(function(e, categories)
      {
        if (e)
        {
          console.log("Failed on router.get('/inventory')\nError:".error, e.message.error + "\n")
          e.status = 406; next(e);
        }
        else
        {
          res.render('updateDepartment', {title: 'Update department', department: department, categories: categories});
        }
      }); 
    }
  });
});


router.post('/update-department/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let departmentID = req.params.id;
  var departmentName = toTitleCase(req.body.departmentName);

  Department.getDepartmentById(departmentID, function(e, department)
  {
    var oldDepartmentName = department.departmentName;
    Product.getAllProducts(function(e, products)
    {
      for (let x = 0; x < products.length; x++)
      {
        if (products[x].department.includes(oldDepartmentName))
        {
          Product.findOneAndUpdate({"_id": products[x]._id}, 
          { $set: {
            "department"    : departmentName
            }
          },
          { new: true }, function(e, result){
            console.log("department updated in product")
          });
        }
      }
      Department.findOneAndUpdate({"_id": departmentID}, 
      { $set: {
        "departmentName"  : departmentName,
        "categories"      : req.body.categoryName
        }
      },
      { new: true }, function(e, result){
        req.flash('success_msg', 'Department updated!');
        res.redirect('/dashboard/departments');
      });
    });
  })
});

router.get('/delete-department/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let departmentID = req.params.id;
  Department.getDepartmentById(departmentID, function(e, department)
  {
    var oldDepartmentName = department.departmentName;
    Product.getAllProducts(function(e, products)
    {
      for (let x = 0; x < products.length; x++)
      {
        if (products[x].department.includes(oldDepartmentName))
        {
          console.log("This product includes same category")
          console.log("product: ", products[x]);
          Product.findOneAndUpdate({"_id": products[x]._id}, 
          { $set: {
            "department"    : "",
            "category"      : ""
            }
          },
          { new: true }, function(e, result){
            console.log("department deleted in product")
          });
        }
      }
      Department.deleteOne({ "_id": departmentID }, function(e, result){
        req.flash('success_msg', 'A department successfully deleted from database');
        res.redirect('/dashboard/departments');
      });
    });

  })



  
});

router.get('/categories', ensureAuthenticated, ensureAdmin, function(req, res, next)
{
  Category.getAllCategories(function(e, categories)
  {
    if (e)
    {
      console.log("Failed on router.get('/inventory')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      res.render('categories', {title: 'Categories', categories: categories});
    }
  });
});

router.get('/insert-category', ensureAuthenticated, ensureAdmin, function(req,res){
  res.render('insertCategory', {title: 'Insert Category'})
});

router.post('/insert-category', ensureAuthenticated, ensureAdmin, function(req, res, next){
  var category = new Category({
    categoryName        : toTitleCase(req.body.categoryName)
  });
  category.save();
  req.flash('success_msg', 'New category successfully added to database');
  res.redirect('/dashboard/categories');
});

router.get('/update-category/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let categoryID = req.params.id;
  Category.findOne({ "_id": categoryID }, function(e, category){
    if (e)
    {
      console.log("Failed on router.get('/dashboard/update-category')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else 
    {
      res.render('updateCategory', {title: 'Update category', category: category});
    }
  });
});

router.post('/update-category/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let categoryID = req.params.id;
  var categoryName = toTitleCase(req.body.categoryName);

  Category.getCategoryById(categoryID, function(e, category)
  {
    oldCategoryName = category.categoryName
    Department.getAllDepartments(function(e, departments)
    {
      for (let i = 0; i < departments.length; i++)
      {
        if (departments[i].categories.includes(oldCategoryName))
        {
          var array = departments[i].categories.split(",");
          var index = array.indexOf(oldCategoryName);
          array[index] = categoryName
          array = array.toString();
          Department.findOneAndUpdate({"_id": departments[i]._id}, 
          { $set: {
            "categories"      : array
            }
          },
          { new: true }, function(e, result){
            console.log("category deleted from department")
          });
        }
      }
      Product.getAllProducts(function(e, products)
      {
        for (let x = 0; x < products.length; x++)
        {
          if (products[x].category.includes(oldCategoryName))
          {
            Product.findOneAndUpdate({"_id": products[x]._id}, 
            { $set: {
              "category"    : categoryName
              }
            },
            { new: true }, function(e, result){
              console.log("category deleted from product")
            });
          }
        }
        Category.findOneAndUpdate({"_id": categoryID}, 
        { $set: {
          "categoryName"  : categoryName
          }
        },
        { new: true }, function(e, result){
          req.flash('success_msg', 'Category updated!');
          res.redirect('/dashboard/categories');
        });
      });
    })
  })


  

  
});

// GET request for deleting the department
// It is also deleting category in departments and products
router.get('/delete-category/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let categoryID = req.params.id;
  Category.getCategoryById(categoryID, function(e, category)
  {
    categoryName = category.categoryName
    Department.getAllDepartments(function(e, departments)
    {
      for (let i = 0; i < departments.length; i++)
      {
        if (departments[i].categories.includes(categoryName))
        {
          var array = departments[i].categories.split(",");
          var index = array.indexOf(categoryName);
          if (index > -1) {
            array.splice(index, 1);
          }
          array = array.toString();
          Department.findOneAndUpdate({"_id": departments[i]._id}, 
          { $set: {
            "departmentName"  : departments[i].departmentName,
            "categories"      : array
            }
          },
          { new: true }, function(e, result){
            console.log("category deleted from department")
          });

        }
      }
      Product.getAllProducts(function(e, products)
      {
        for (let x = 0; x < products.length; x++)
        {
          if (products[x].category.includes(categoryName))
          {
            Product.findOneAndUpdate({"_id": products[x]._id}, 
            { $set: {
              "category"    : ""
              }
            },
            { new: true }, function(e, result){
              console.log("category deleted from product")
            });
          }
        }
        Category.deleteOne({ "_id": categoryID }, function(e, result){
          req.flash('success_msg', 'A category successfully deleted from database');
          res.redirect('/dashboard/categories');
        });
      });
    })
  })
});


/////////////////////////////////////////////////////////////////////
//
// MIDDLEWARES - Handles GET & POST requests to the Sale pages
//
// Renders Sale pages
//
/////////////////////////////////////////////////////////////////////
router.get('/Sale-codes', ensureAuthenticated, ensureAdmin, function(req, res, next)
{
  Sale.getAllSales(function(e, Sales)
  {
    if (e)
    {
      console.log("Failed on router.get('/dashboard/Sale-codes')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      res.render('SaleCodes', {title: 'Sale Codes', Sales: Sales});
    }
  });
});

// GET request for getting insert Sale code page
router.get('/insert-Sale-code', ensureAuthenticated, ensureAdmin, function(req, res, next){
  res.render('insertSaleCode', {title: 'Insert Inventory'})
});

// POST request for inserting new Sale code
router.post('/insert-Sale-code', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let Sale = new Sale({
    code          : req.body.code,
    description   : req.body.description,
    percentage    : req.body.percentage,
  });
  Sale.save();
  req.flash('success_msg', 'New Sale code successfully added to database');
  res.redirect('/dashboard/Sale-codes');
});

// GET request for deleting the Sale code
router.get('/delete-Sale-code/:id', ensureAuthenticated, ensureAdmin, function(req, res, next){
  let SaleCodeId = req.params.id;
  Sale.deleteOne({ "_id": SaleCodeId }, function(e, result){
    if (e)
    {
      console.log("Failed on router.get('/dashboard/delete-Sale-code')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else {
      req.flash('success_msg', 'A Sale code successfully deleted from database');
      res.redirect('/dashboard/Sale-codes');
    }
  });
});

/////////////////////////////////////////////////////////////////////
//
// MIDDLEWARES - Handles GET & POST requests to the user pages
//
// Renders user pages
//
/////////////////////////////////////////////////////////////////////
router.get('/user-list', ensureAuthenticated, ensureAdmin, function(req, res, next)
{
  User.getAllUsers(function(e, users)
  {
    if (e)
    {
      console.log("Failed on router.get('/inventory')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      res.render('users', {title: 'Users', users: users});
    }
  });
});
// GET request for deleting the existing user
router.get('/delete-user/:id', ensureAuthenticated, function(req, res, next){
  let userID = req.params.id;
  User.deleteOne({ "_id": userID }, function(e, result){
    if (e)
    {
      console.log("Failed on router.get('/dashboard/delete-user')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else {
      req.flash('success_msg', 'A user successfully deleted from database');
      res.redirect('/dashboard/user-list');
    }
  });
});

/////////////////////////////////////////////////////////////////////
//
// MIDDLEWARES - Handles GET requests to the sales page
//
// Renders all sales
//
/////////////////////////////////////////////////////////////////////
router.get('/sales', ensureAuthenticated, ensureAdmin, function(req, res, next)
{
  Order.getAllOrders(function(e, orders)
  {
    if (e)
    {
      console.log("Failed on router.get('/inventory')\nError:".error, e.message.error + "\n")
      e.status = 406; next(e);
    }
    else
    {
      res.render('sales', {title: 'Sales', sales: orders});
    }
  });
});


/////////////////////////////////////////////////////////////////////
//
// Function ensureAuthenticated()
//
// Check if the user authenticated or not. If not returns to login page
//
/////////////////////////////////////////////////////////////////////
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    Department.getAllDepartments(function(e, departments)
    {
      req.session.department = JSON.stringify(departments)
      return next();
    })
  }
  else{
    req.flash('error_msg', 'You are not logged in');
    res.redirect('/');
  }
};

/////////////////////////////////////////////////////////////////////
//
// Function ensureAdmin()
//
// Check if the user admin or not. If not returns to root page
//
/////////////////////////////////////////////////////////////////////
function ensureAdmin(req, res, next){
  if(req.user.admin){
    return next();
  }
  else{
    req.flash('error_msg', 'This page cannot be displayed with your permissions');
    res.redirect('/');
  }
};

/////////////////////////////////////////////////////////////////////
//
// function toTitleCase()
// Returns title case of argument, nothing special.
//
/////////////////////////////////////////////////////////////////////
function toTitleCase(arg)
{
    return arg.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

module.exports = router;
