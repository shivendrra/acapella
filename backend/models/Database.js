require("dotenv").config({path: ".env"});
const mongoose = require("mongoose");
const mongoose_url = process.env.MONGOOSE_URL;
console.log("DEBUGG [STATE 2001] | In databse.js");

mongoose.connect(mongoose_url)
  .then( () => {
    console.log("DEBUGG [INFO 2002] | Databse connected...");
  }).catch( (err) => {
    console.log("DEBUGG [ERROR 2004] | Can't connect to database due to error: ", + err);
  })

module.exports = mongoose;