const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log("dbconnection successful"))
.catch((err) => {
    console.log(err)
})

require('./User')
require('./Url')