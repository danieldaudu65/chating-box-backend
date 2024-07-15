const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config()

const app = express();

mongoose.connect(process.env.MONGO_URI)
    .catch(error => console.log(`DB Connection error: ${error}`));
const con = mongoose.connection;
// handle error when opening db
con.on('open', error => {
    if (!error)
        console.log('DB Connection Successful');
    else
        console.log(`Error Connecting to DB: ${error}`);
});

// handle mongoose disconnect from mongodb
con.on('disconnected', error => {
    console.log(`Mongoose lost connection with MongoDB:
${error}`);
});

// parse JSON data coming in the request body
app.use(express.json());


// gain access to my routes
app.use("/auth", require('./routes/auth'));
app.use("/post", require('./routes/post'));
app.use("/profile", require('./routes/profile'));


const PORT = process.env.PORT || 7000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));