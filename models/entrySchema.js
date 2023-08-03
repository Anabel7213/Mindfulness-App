const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: String,
    title: {
        type: String,
        required: [true, "Please provide a title for your entry"]
    },
    content: String
});

const Entry = mongoose.model("Entry", entrySchema);
module.exports = Entry;