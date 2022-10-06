require('../model/database')
const User = require('../model/User')
const Url = require('../model/Url')

/**
 * post/
 * shortenUrl
 */
 exports.shortenUrl = async(req, res) =>{
    try {
        const { longURL, slug } = req.body
        Url.findOne({ slug: slug }, (err,data) =>{
            if(err) throw err
            if(data){
                res.render('dashboard',{ err: "Try a different short url", title: 'Url Shortr | Dashboard', req: req, csrfToken: req.csrfToken() });
            }else{
                Url({
                    originalUrl: longURL,
                    slug: slug,
                    owner: req.user.email
                }).save((err) =>{
                    res.redirect("/dashboard")
                })
            }
        })
    } catch (error) {
        res.status(500).send({message: error.message || "Error occured"});
    }
}