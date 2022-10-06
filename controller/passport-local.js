require('../model/database')
const User = require('../model/User')
const bcrypt = require("bcrypt");
const localStrategy = require("passport-local").Strategy;

module.exports = function(passport){
    passport.use(new localStrategy({usernameField: 'email'}, (email, password, done) => {
        User.findOne({ email: email }, (err, data) => {
            if(err) throw err;
            if(!data){
                return done(null, false, {message: "Invalid email"})
            }
            bcrypt.compare(password, data.password, (err, match) => {
                if(err){
                    return done(null, false)
                }
                if(!match){
                    return done(null, false, {message: "Incorrect password"})
                }
                if(match){  
                    if(data.isVerified) {
                        return done(null, data)
                    }else{
                        return done(null, false, {message: "Kindly verify your email address"})
                    }                 
                }
            })
        })
    }))

    passport.serializeUser(function (user, done){
        done(null, user.id)
    })

    passport.deserializeUser(function(id, done){
        User.findById(id, function(err, user){
            done(err, user)
        })
    })
}


// const user = User.findOne({ email: email })
// if(!user){
//     return done(null, false, {message: "Invalid email"})
// }
// bcrypt.compare(password, data.password, (err, match) => {})