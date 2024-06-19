//create user model
const mongoose = require("mongoose");
const Schema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    todos:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Todo"
        }

    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },

});

const User = mongoose.model("User", Schema);

module.exports = User;
