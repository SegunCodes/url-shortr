const mongoose = require("mongoose");

const UrlSchema = new mongoose.Schema({
        owner:{
            type:String,
            require: true,
        },
        originalUrl:{
            type:String,
            require: true,
        },
        slug:{
            type:String,
            required:true,
            unique:true,
        },
        visits:{
            type:Number,
            default:0,
        },
        visitsFB:{
            type:Number,
            default:0,
        },
        visitsIG:{
            type:Number,
            default:0,
        },
        visitsYT:{
            type:Number,
            default:0,
        }
    },
    {timestamps:true}
);

module.exports = mongoose.model("Url", UrlSchema)