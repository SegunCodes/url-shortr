const express = require("express")
const app = express()
const dotenv = require("dotenv")
dotenv.config()
const session = require("express-session")
const expressLayouts = require("express-ejs-layouts")
const csrf = require("csurf")
const cookieParser = require("cookie-parser")
var MemoryStore = require("memorystore")(session)
const passport = require("passport")
const flash = require("connect-flash")

app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('public'))
app.use(expressLayouts)
app.use(cookieParser('secretKey'))
app.use(session({
    secret: "secretKey",
    saveUninitialized: false,
    resave: false,
    maxAge: 60 * 1000,
    store: new MemoryStore({
        checkPeriod: 864000
    })
}))
app.use(csrf())
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(function(req, res, next){
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.locals.error = req.flash('error')
    next();
})
app.set('layout', './layouts/main')
app.set("view engine", "ejs");

const routes = require('./routes/routes')
app.use("/", routes)

app.listen(process.env.PORT || 5000, ()=>{
    console.log("Backend server running");
})