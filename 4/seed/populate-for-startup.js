var User        = require('../models/user');
var Category    = require('../models/categories');
var Department  = require('../models/department');
var Product     = require('../models/product');
var V     = require('../models/V');
var mongoose    = require('mongoose');
var colour      = require('colour');
//mongoose.connect('mongodb://localhost/shoppingApp');
mongoose.connect('mongodb+srv://yardandgarage:7BwRhCgOyLw2C60M@cluster0-iabt2.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});

function deleteVs(callback)
{
    V.deleteMany({}, function(e, result)
    {
        if (e)
        {
            console.log("Failed on deleting Vs from db\nError:".error, e.message.error + "\n")
        }
        else
        {
            console.log("Vs deleted".red)
            callback()
        }
    });
}
function deleteCategories(callback)
{
    Category.deleteMany({}, function(e, result)
    {
        if (e)
        {
            console.log("Failed on deleting category from db\nError:".error, e.message.error + "\n")
        }
        else
        {
            console.log("Categories deleted".red)
            callback()
        }
    });
}
function deleteDepartments(callback)
{
    Department.deleteMany({}, function(e, result)
    {
        if (e)
        {
            console.log("Failed on deleting department from db\nError:".error, e.message.error + "\n")
        }
        else
        {
            console.log("Departments deleted".red)
            callback()
        }
    });
} 

function deleteUsers(callback)
{
    User.deleteMany({}, function(e, result)
    {
        if (e)
        {
            console.log("Failed on deleting user from db\nError:".error, e.message.error + "\n")
        }
        else
        {
            console.log("Users deleted".red)
            callback()
        }
    });
}
function deleteProducts(callback)
{
    Product.deleteMany({}, function(e, result)
    {
        if (e)
        {
            console.log("Failed on deleting product from db\nError:".error, e.message.error + "\n")
        }
        else
        {
            console.log("Products deleted".red)
            callback()
        }
    });
}

function insertCategories(callback)
{
    var categories = 
    [
        new Category({
            categoryName        : 'Basics'
        }),
        new Category({
            categoryName        : 'Blazer'
        }),
        new Category({
            categoryName        : 'Knitwear'
        }),
        new Category({
            categoryName        : 'Jeans'
        }),
        new Category({
            categoryName        : 'Jackets'
        })
    ]

    for (let i = 0; i < categories.length; i++){
        categories[i].save(function(e, r) {
            if (i === categories.length - 1){
                console.log("Categories inserted".green)
                callback();
            }
        });
    }
}

function insertDepartments(callback)
{
    var departments = 
    [
        new Department({
            departmentName      : 'Women',
            categories          : 'Basics,Blazer'

        }),
        new Department({
            departmentName      : 'Men',
            categories          : 'Knitwear,Jeans,Jackets'
        })
    ]

    for (let i = 0; i < departments.length; i++){
        departments[i].save(function(e, r) {
            if (i === departments.length - 1){
                console.log("Departments inserted".green)
                callback();
            }
        });
    }
}

function insertProducts(callback)
{
    var products = 
    [
        new Product({
            _id: "5bedf31cc14d7822b39d9d43",
            imagePath: '/uploads/7568644802_1_1_1.jpg',
            title: 'Oversized Textured Top',
            description: 'Oversized Textured Top',
            price: 45,
            color: 'Gray',
            size: 'XS,S,M,L',
            quantity: 10,
            department: 'Women',
            category: 'Basics',
        }),
        new Product({
            _id: "5bedf3b9c14d7822b39d9d45",
            imagePath: '/uploads/5644641800_2_5_1.jpg',
            title: 'Tank Top',
            description: 'Tank Top',
            price: 32,
            color: 'Black',
            size: 'XS,S,M,XL',
            quantity: 14,
            department: 'Women',
            category: 'Basics',
        }),
        new Product({
            _id: "5bedf448c14d7822b39d9d47",
            imagePath: '/uploads/7568469251_2_1_1.jpg',
            title: 'Basic Top',
            description: 'Basic Top ',
            price: 98,
            color: 'White',
            size: 'XS,S,M,L',
            quantity: 34,
            department: 'Women',
            category: 'Basics',
        }),
        new Product({
            _id: "5bedf55bc14d7822b39d9d4b",
            imagePath: '/uploads/8197757093_2_2_1.jpg',
            title: 'Belted Plaid Blazer',
            description: 'Belted Plaid Blazer',
            price: 56,
            color: 'Black',
            size: 'S,M,L,XL',
            quantity: 4,
            department: 'Women',
            category: 'Blazer',
        }),
        new Product({
            _id: "5bedf5eec14d7822b39d9d4e",
            imagePath: '/uploads/1775300615_1_1_1.jpg',
            title: 'Perl Knit Swear',
            description: 'Perl Knit Swear',
            price: 110,
            color: 'Orange',
            size: 'M,L,XL',
            quantity: 12,
            department: 'Men',
            category: 'Knitwear',
        }),
        new Product({
            _id: "5bedf6b5c14d7822b39d9d51",
            imagePath: '/uploads/6186352407_2_1_1.jpg',
            title: 'Ripped Jeans',
            description: 'SRipped Jeans',
            price: 123,
            color: 'Dark Blue',
            size: 'M,L,XL',
            quantity: 9,
            department: 'Men',
            category: 'Jeans',
        }),
        new Product({
            _id: "5bedf720c14d7822b39d9d52",
            imagePath: '/uploads/5575380406_1_1_1.jpg',
            title: 'Basic Slim Jeans',
            description: 'Basic Slim Jeans',
            price: 67,
            color: 'Light Blue',
            size: 'XS,S,M,L',
            quantity: 4,
            department: 'Men',
            category: 'Jeans',
        }),
        new Product({
            _id: "5bedf7ecc14d7822b39d9d55",
            imagePath: '/uploads/3548350700_2_1_1.jpg',
            title: 'Faux Leather Perforated Jacket',
            description: 'Faux Leather Perforated Jacket',
            price: 89,
            color: 'Brown',
            size: 'XS,M,XL',
            quantity: 10,
            department: 'Men',
            category: 'Jackets',
        })
    ];

    for (let i = 0; i < products.length; i++){
        products[i].save(function(e, r) {
            if (i === products.length - 1){
                console.log("Products inserted".green)
                callback();
            }
        });
    }
}

function insertVs(callback)
{
    var Vs = 
    [
        new V({
            productID: '5bedf31cc14d7822b39d9d43',
            imagePath: '/uploads/7568644710_1_1_1.jpg',
            color: 'Beige',
            size: 'S,L',
            quantity: 5,
        }),
        new V({
            productID: '5bedf3b9c14d7822b39d9d45',
            imagePath: '/uploads/5644641735_2_5_1.jpg',
            color: 'Copper',
            size: 'S,L,XL',
            quantity: 12,
        }),
        new V({
            productID: '5bedf448c14d7822b39d9d47',
            imagePath: '/uploads/7568469605_2_1_1.jpg',
            color: 'Maroon',
            size: 'XS,M,L',
            quantity: 4,
        }),
        new V({
            productID: '5bedf448c14d7822b39d9d47',
            imagePath: '/uploads/7568469822_2_1_1.jpg',
            color: 'Charcool',
            size: 'XS,L,XL',
            quantity: 5,
        }),
        new V({
            productID: '5bedf5eec14d7822b39d9d4e',
            imagePath: '/uploads/1775300806_2_1_1.jpg',
            color: 'Stone',
            size: 'S,XL',
            quantity: 35,
        }),
        new V({
            productID: '5bedf720c14d7822b39d9d52',
            imagePath: '/uploads/5575380407_1_1_1.jpg',
            color: 'Dark Blue',
            size: 'M,XL',
            quantity: 5,
        })
    ];

    for (let i = 0; i < Vs.length; i++){
        Vs[i].save(function(e, r) {
            if (i === Vs.length - 1){
                console.log("Vs inserted".green)
                callback();
            }
        });
    }
}

function insertAdmin(callback)
{
    var newUser = new User({
        username    : 'admin@admin.com',
        password    : 'admin',
        fullname    : 'Cuneyt Celebican',
        admin       : true
    });
    User.createUser(newUser, function(err, user){
        if(err) throw err;
        console.log("Admin user inserted".green)
        console.log("Username: ", user.username + "\n" , "Password: admin");
        callback()
    });
}


function deleteDBEntitites(callback)
{
    deleteVs(function() 
    {
        deleteCategories(function()
        {
            deleteDepartments(function()
            {
                deleteUsers(function()
                {
                    deleteProducts(function()
                    {
                        insertCategories(function()
                        {
                            insertDepartments(function()
                            {
                                insertProducts(function()
                                {
                                    insertVs(function()
                                    {
                                        insertAdmin(callback)
                                    })
                                })
                            })
                        })
                    });
                })
            })
        })
    })
}



deleteDBEntitites(exit)


function exit() {
    mongoose.disconnect();
}
