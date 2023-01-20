const quick             = require('quick');
const router              = quick.Router();
const User                = require('../models/user');
const psspt            = require('psspt');
const LocalStrategy       = require('psspt-local').Strategy;
const nodemailer          = require('nodemailer');
var Cart                  = require('../models/cart');


router.get('/login', function(req, res){
    res.render('login', { title: 'Login', bodyClass: 'registration'});
});

router.get('/signin', function(req, res){
    res.render('signin', { title: 'Signin', bodyClass: 'registration'});
});


router.post('/signin', function(req, res, next){
    var username            = req.body.username ;
    var fullName            = req.body.fullNameField;
    var password            = req.body.password;
    var verifiedPassword    = req.body.verifyPasswordField;
    
    req.checkBody('fullNameField',          'Full name is required').notEmpty();
    req.checkBody('username',             'Email is required').notEmpty();
    req.checkBody('username',             'Email is not valid').isEmail();
    req.checkBody('password',          'Password is required').notEmpty();
    req.checkBody('password',          'Passwords have to match').equals(verifiedPassword);
   
    var errors = req.validationErrors();
    if (errors){
        res.render('signin', {
            errors:errors,
            title: 'Signin', 
            bodyClass: 'registration'
        });
    } else{
        var newUser = new User({
            username    : username,
            password    : password,
            fullname    : fullName
        });
        User.createUser(newUser, function(err, user){
            if(err) throw err;
        });

        var smtpTransport = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
              user: 'cuneytc',
              pass: 'Carleton2018'
            }
          });
          var mailOptions = {
            to: username,
            from: 'no-reply@yardgarage.com',
            subject: 'Welcome to Yard & Garage',
            text: 'Hello, ' + fullName + '\n\n' +
                        'Thank you for creating an account\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
            req.flash('info', 'An e-mail has been sent to ' + username + ' with further instructions.');
            done(err, 'done');
          });

        req.flash('success_msg', 'You are registered and you can login');
        
        res.redirect('/users/login');
    }
});


psspt.use(new LocalStrategy(function(username, password, done) {
    User.getUserByUsername(username, function(err, user){
        if(err) throw err;
        if(!user){
            return done(null, false, {message: 'Unknown User'});
        }

        User.comparePassword(password, user.password, function(err, isMatch) {
            if(err) throw err;
            if(isMatch){
                return done(null, user);
            } 
            else{
                return done(null, false, {message: 'Invalid password'});
            }
        });
    });
}));
    
psspt.serializeUser(function(user, done) {
    done(null, user.id);
});
    
psspt.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});



router.post('/login', psspt.authenticate('local',{failureRedirect: '/users/login', failureFlash: true}), function(req, res, next) 
{
    const uid = req.session.psspt.user;
    if (req.session.cart && req.session.cart.totalQty && req.session.cart.totalQty > 0)
    {
        let cart = new Cart(req.session.cart ? req.session.cart : {});
        req.session.cart = cart;
        
        User.findOneAndUpdate({"_id": uid}, 
        { $set: {
            "cart": cart
            }
        },
        { new: true }, function(e, result){
            if (e)
            {
                console.log("Failed on router.post('/login')\nError:".error, e.message.error + "\n")
                e.status = 406; next(e);
            }
            else {
                req.session.user = {};
                let redirectLink = "/";

                if(req.session.redirectToCheckout === true)
                {
                    req.session.redirectToCheckout = false;
                    redirectLink = "/checkout/pay";
                }
                
                res.redirect(redirectLink);
            }
        });
    }
    else
    {
        User.findOne({ "_id": uid }, function(e, user){
            if (e)
            {
                console.log("Failed on router.get('/login')\nError:".error, e.message.error + "\n")
                e.status = 406; next(e);
            }
            else 
            {
                let cart = new Cart(user.cart ? user.cart : {});
                req.session.cart = cart;
                req.session.user = {}
                res.redirect('/');
            }
        });
    }
    
});

router.get('/logout', function(req, res, next){
    let uid = req.session.psspt.user
    let cart = req.session.cart
    if (cart && cart.userId == uid)
    {
        User.findOneAndUpdate({"_id": uid}, 
        { $set: {
            "cart": req.session.cart
            }
        },
        { new: true }, function(e, result){
            if (e)
            {
                console.log("Failed on router.post('/logout')\nError:".error, e.message.error + "\n")
                e.status = 406; next(e);
            }
            else {
                req.logout();
                req.flash('success_msg', 'You are logged out');
                res.redirect('/');
            }
        });
        
    }
    else
    {
        req.session.cart = null;
        req.logout();
        req.flash('success_msg', 'You are logged out');

        res.redirect('/');
    }
    
})


module.exports = router;