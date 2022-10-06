require('../model/database')
const User = require('../model/User')
const bcrypt = require("bcrypt");
const randomstring = require("randomstring")
const nodemailer = require("nodemailer")
const hbs = require("nodemailer-express-handlebars")
const passport = require("passport")
const Url = require('../model/Url')
require('./passport-local')(passport)
const nodemailerFrom = process.env.fromMail;
const nodemailerObject = {
    service : process.env.mailService,
    host : process.env.mailHost,
    port : process.env.mailPort,
    secure: true,
    // encryption : process.env.mailEncryption,
    auth : {
        user: process.env.fromMail,
        pass : process.env.mailPassword
    }
}
const handlebarOptions = {
    viewEngine: {
        extName: ".handlebars",
        partialsDir: './views/email-template',
        defaultLayout: false
    },
    viewPath: './views/email-template',
    extName: ".handlebars"
}


/**
 * Get/
 * homepage
 */
exports.homepage = async(req, res) =>{
    try {
        res.render('index',{ req: req });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Get/
 * error page
 */
 exports.errorPage = async(req, res) =>{
    try {
        res.status(404).render('error',{ req: req, title: "404 PAGE | URL Shortr" });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Get/
 * slugpage
 */
 exports.slugPage = async(req, res) =>{
    try {
        if(req.params.slug != undefined){
            var data = await Url.findOne({ slug: req.params.slug })
            if(data){
                data.visits = data.visits + 1;
                var ref = req.query.ref
                if(ref){
                    switch (ref) {
                        case 'fb':
                            data.visitsFB = data.visitsFB + 1;
                            break;
                        case 'ig':
                            data.visitsIG = data.visitsIG + 1;
                            break;
                        case 'yt':
                            data.visitsYT = data.visitsYT + 1;
                            break;
                    }
                }
                await data.save()
                res.redirect(data.originalUrl)
            }else{
                res.redirect('/404')
            }
        }else{
            res.redirect("/")
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}


/**
 * Get/
 * register page
 */
exports.registerPage = async(req, res) =>{
    try {
        if(req.user){
            res.redirect("/dashboard");
            return;
        }
        res.render('register',{ title: 'Url Shortr | Register', req: req, csrfToken: req.csrfToken() });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}


/**
 * post/
 * register 
 */
exports.processRegistration = async(req, res) =>{
    try {
        const { email, username, password, cpassword } = req.body
        if(password != cpassword){
            res.render('register',{ err: "Password does not match", title: 'Url Shortr | Register', req: req, csrfToken: req.csrfToken() });
        }else{
            User.findOne({ $or : [
                {email : email}, 
                {username: username}
            ]}, function(err, data){
                if(err) throw err
                if(data){
                    res.render('register',{ err: "User already exists", title: 'Url Shortr | Register', req: req, csrfToken: req.csrfToken() });
                }else{
                    const verificationToken = randomstring.generate()
                    bcrypt.hash(password, 10, async function (error, hash){
                        User.create({
                            username : username,
                            email : email,
                            password : hash,
                            verificationToken : verificationToken,
                        }, async function(error, data){
                            const transporter = nodemailer.createTransport(nodemailerObject);
                            transporter.use("compile", hbs(handlebarOptions))
                            await transporter.sendMail({
                                from: nodemailerFrom,
                                to: email,
                                subject: "URL SHORTR - Email Verification",
                                template: 'email',
                                context: {
                                    link: verificationToken
                                }
                            }, function (error, info){
                                if(error){
                                    console.error(error)
                                }else{
                                    console.log("Email sent" + info.response)
                                }
                                res.render('register',{ 
                                    msg: "Signed up successfully. An email has been sent to verify your account. Once verified, you can start using URL Shortr.", 
                                    title: 'Url Shortr | Register', 
                                    req: req, 
                                    csrfToken: req.csrfToken()
                                });
                            })
                        })
                    });
                }
            });
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * verify/
 * verify email
 */
exports.verifyEmail = async(req, res) =>{
    try {
        const verificationToken = req.params.verificationToken;
        const user = await User.findOne({verificationToken: verificationToken});
        if (!user) {
            res.render('login',{ err: "Invalid Token", title: 'Verify Email | File Share', req: req, csrfToken: req.csrfToken() });
        } else {
            await User.findOneAndUpdate({verificationToken: verificationToken},{
                $set: {
                    "verificationToken": "",
                    "isVerified": true
                }
            })
            res.render('login',{ msg: "Email has been verified, please login", title: 'Verify Email | File Share', req: req, csrfToken: req.csrfToken()});
        }
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}


/**
 * Get/
 * login page
 */
exports.loginPage = async(req, res) =>{
    try {
        if(req.user){
            res.redirect("/dashboard");
            return;
        }
        res.render('login',{ title: 'Url Shortr | Login', req: req, csrfToken: req.csrfToken() });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}


/**
 * post/
 * process login
 */
 exports.processLogin = async(req, res, next) =>{
    try {
        passport.authenticate('local', {
            failureRedirect: "/login",
            successRedirect: "/dashboard",
            failureFlash: true
        })(req, res, next)
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}


/**
 * Get/
 * forgot password page
*/
exports.forgotPasswordPage = async(req, res) =>{
    try {
        if(req.user){
            res.redirect("/dashboard");
            return;
        }
        res.render('forgot-password',{ title: 'URL Shortr | Forgot Password', req: req, csrfToken: req.csrfToken() });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}


/**
 * Post/
 * send Recovery Link
 */
exports.sendRecoveryLink = async(req, res) =>{
    try {
        const email = req.body.email
        const user = await User.findOne({email:email});
        if (!user) {
            res.render('forgot-password',{ err: "Email does not exist", title: 'URL Shortr | Forgot Password', req: req, csrfToken: req.csrfToken() });
        }
        const resetToken = randomstring.generate()
        await User.findOneAndUpdate({
            email: email
        }, {
            $set: {
                resetToken : resetToken
            }
        })
        const transporter = nodemailer.createTransport(nodemailerObject);
        transporter.use("compile", hbs(handlebarOptions))
        await transporter.sendMail({
            from: nodemailerFrom,
            to: email,
            subject: "URL SHORTR - Reset Password link",
            template: 'reset',
            context: {
                link: resetToken,
                email: email
            }
        }, function (error, info){
            if(error){
                console.error(error)
            }else{
                console.log("Email sent" + info.response)
            }
            res.render('forgot-password',{ 
                msg: "Check your mail! A reset password link has been sent to your email.", 
                title: 'Url Shortr | Forgot Password', 
                req: req, 
                csrfToken: req.csrfToken()
            });
        })
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Get/
 * reset password page
 */
exports.resetPasswordPage = async(req, res) =>{
    try {
        if(req.user){
            res.redirect("/dashboard");
            return;
        }
        const email = req.params.email;
        const resetToken = req.params.resetToken;
        const user = await User.findOne({
            $and: [{
                email:email,
            }, {
                resetToken: resetToken
            }]
        });
        if (!user) {
            res.render('forgot-password',{ err: "Link has expired", title: 'URL Shortr | Forgot Password', req: req, csrfToken: req.csrfToken() })
        }

        res.render('reset-password',{ title: 'URL Shortr | Reset Password', req: req, email: email, resetToken: resetToken, csrfToken: req.csrfToken() });
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}


/**
 * Post/
 * reset password
 */
exports.resetPassword = async(req, res) =>{
    try {
        const email = req.body.email;
        const resetToken = req.body.resetToken;
        if(req.body.password != req.body.confirmPassword){
            res.render('reset-password',{ err: "Password do not match" ,title: 'URL Shortr | Reset Password', req: req, email: email, resetToken: resetToken, csrfToken: req.csrfToken() });
        }
        const user = await User.findOne({
            $and: [{
                email:email,
            }, {
                resetToken: resetToken
            }]
        });
        if(!user){
            res.render('reset-password',{ err: "Link has expired." ,title: 'URL Shortr | Reset Password', req: req, csrfToken: req.csrfToken() });
        }
        bcrypt.hash(req.body.password, 10, async function (error, hash){

            await User.findOneAndUpdate({
                $and: [{
                    email: email,
                }, {
                    resetToken: resetToken
                }]
            },{
                $set: {
                    resetToken: "",
                    password : hash
                }
            })
            res.render('login',{ msg: "Password successfully reset, login to your account" ,title: 'Url Shortr | Login', req: req, csrfToken: req.csrfToken() });
        })
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Get/
 * dashboard
 */
 exports.dashboard = async(req, res) =>{
    try {
        if(!req.isAuthenticated()){
            res.redirect("/login");
            return;
        }
        Url.find({ owner: req.user.email }, (err, data) =>{
            if(err) throw err
            res.render('dashboard',{ title: 'Url Shortr | Dashboard', req: req, csrfToken: req.csrfToken(), urls: data });
        })
        
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

/**
 * Get/
 * logout
 */
exports.logout = async(req, res, next) =>{
    try {
        req.logout(function(err) {
            if (err) { return next(err); }
            res.redirect('/');
        });
        // req.session.destroy(function(err){
        //     res.redirect("/")
        // })
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}

