var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var User = require('../models/user');
var Post = require('../models/post');
var util = require('util');


/* GET home page. */
router.get('/', function(req, res, next) {
    Post.get(null, function(err, posts){
        if (err) {
            posts = [];
        }
        res.render('index', {
            title: 'Home',
            current: 'home',
            posts: posts,
        })
    })
});

router.get('/user/:user', checkLogin);
router.get('/user/:user', function(req,res){
    User.get(req.params.user, function(err, user){
        if (!user) {
            req.flash('error', 'This user doesn\'t exist.');
            return res.redirect('/');
        }
        Post.get(user.name, function(err, posts){
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.name,
                posts: posts,
            })
        })
    })
})

/*post article*/
router.post('/post', checkLogin);
router.post('/post', function(req, res, next){
    var currentUser = req.session.user;
    var post = new Post(currentUser.name, req.body.post);
    post.save(function(err){
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        } else {
            req.flash('success', 'Post success!');
            res.redirect('/user/' + currentUser.name);
        }
    })
});

/*register*/
router.get('/reg', checkNoLogin);
router.get('/reg', function(req, res, next){
    res.render('register', {
        title: 'Register',
        current: 'register',
    })
});

router.post('/reg', checkNoLogin);
router.post('/reg', function(req, res, next){
    console.log('body:', req.body);
    if (req.body['pwda'] != req.body['pwd']) {
        req.flash('error', 'the passwords are not the same.');
        return res.redirect('/reg');
    }
    var md5 = crypto.createHash('md5');
    var pwd = md5.update(req.body.pwd).digest('base64');
    var newUser = new User({
        name: req.body.user,
        password: pwd,
    });
    // check whether the user name has existed.
    User.get(newUser.name, function(err, user){
        if(user){
            err = 'Username has already existed.';
        } 
        if(err){
            req.flash('error', err);
            return res.redirect('/reg');
        }
        // add user if user name is new
        newUser.save(function(err){
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');
            }
            req.session.user = newUser;
            req.flash('success', 'register success!');
            res.redirect('/');
        });
    });

});

/*login*/
router.get('/login', checkNoLogin);
router.get('/login', function(req, res, next){
    res.render('login', {
        title: 'login',
        current: 'login',
    })
});

router.post('/login', checkNoLogin);
router.post('/login', function(req, res, next){
    var md5 = crypto.createHash('md5');
    var pwd = md5.update(req.body.pwd).digest('base64');
    User.get(req.body.user, function(err, user){
        if (!user) {
            req.flash('error', 'This user doesn\'t exist.');
            return res.redirect('/login');
        }
        if (user.password != pwd) {
            req.flash('error', 'Password is wrong.');
            return res.redirect('/login');
        }
        req.session.user = user;
        req.flash('success', 'Login success!');
        res.redirect('/');
    });
});

/*logout*/
router.get('/logout', checkLogin);
router.get('/logout', function(req, res, next){
    req.session.user = null;
    req.flash('success', 'Logout success.');
    res.redirect('/');
});

/*util*/
function checkLogin(req, res, next){
    if (!req.session.user) {
        req.flash('error', 'Not login yet');
        return res.redirect('/login');
    }
    next();
}

function checkNoLogin(req, res, next){
    if(req.session.user){
        req.flash('error', 'Already logined');
        return res.redirect('/');
    }
    next();
}


module.exports = router;
