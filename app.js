//-------dependencies-------//
require("dotenv").config();
const express = require("express");
const app = express();
const fs = require("fs");
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static("stylesheets"));

//-------User authorization--------//
const passport = require("passport");
const passportSetup = require(__dirname + "/controllers/googleAuth.js");
const User = require(__dirname + "/models/userSchema.js");
const bcrypt = require("bcryptjs");
const session = require("express-session");

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passportSetup.passport.initialize());
app.use(passportSetup.passport.session());

//-------database-------//
const mongoose = require("mongoose");
const DB = process.env.DB.replace("<password>", process.env.DB_PASS);
mongoose
  .connect(DB)
  .then(() => {
    console.log("Successfully connected");
  })
  .catch((err) => {
    console.log(err);
  });
const Entry = require(__dirname + "/models/entrySchema.js");
const { displayCurrentDate } = require(__dirname +
  "/controllers/controller.js");

//-------authenticatting locally-------//
app.get("/", (req, res) => {
  displayCurrentDate(res, __dirname + "/views/index.html");
});

app.get("/home", passportSetup.isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/views/home.html");
});

app.get("/signup", (req, res) => {
  displayCurrentDate(res, __dirname + "/views/signup.html");
});

app.get("/login", (req, res) => {
  displayCurrentDate(res, __dirname + "/views/login.html");
});

app.post("/signup", async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  try {
    await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      passwordConfirm: hashedPassword
    });
    res.redirect("/login");
  } catch(err) {
    res.redirect("/signup");
    console.log(err);
  }
});

app.post(
  "/login",
  passportSetup.passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  })
);


//-------authenticatting with Google-------//
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get("/auth/google/home", passport.authenticate("google"), (req, res) => {
  console.log(req.user);
  res.redirect("/home");
});

app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) throw err;
  });
  res.redirect("/");
});

//-----------generating prompts-----------//
const prompts = JSON.parse(fs.readFileSync("prompts.json", "utf-8"));
app.get("/api/getRandomPrompt/:categoryName", (req, res) => {
  const { categoryName } = req.params;
  const categoryPrompts = prompts.filter(
    (prompt) => prompt.category === categoryName
  );
  if (categoryPrompts.length === 0) {
    return res
      .status(404)
      .json({ error: "No prompts found for this category" });
  }
  const randomIndex = Math.floor(Math.random() * categoryPrompts.length);
  const randomPrompt = categoryPrompts[randomIndex].prompt;
  res.json({ prompt: randomPrompt });
});

//----------all scriptures route handling-----------//
const entryInstance = fs.readFileSync(__dirname + "/views/entryInstance.html", "utf-8");
const allEntries = fs.readFileSync(__dirname + "/views/scriptures.html", "utf-8");
const singleEntry = fs.readFileSync(__dirname + "/views/entry.html", "utf-8");

app.get("/entry", passportSetup.isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/views/entry.html");
});

app.get("/scriptures/:singleEntryName", async (req, res) => { //read 
  try { //to avoid case sensitivity and a sliced title issue now using _id instead of title 
    const foundEntry = await Entry.findOne({_id: req.params.singleEntryName});
    let updatedFoundEntry = singleEntry.replace(/{@date@}/g, foundEntry.date);
    updatedFoundEntry = updatedFoundEntry.replace(/{@title@}/g, foundEntry.title);
    updatedFoundEntry = updatedFoundEntry.replace(/{@content@}/g, foundEntry.content);
    res.send(updatedFoundEntry);
  } catch(err) {
    throw err;
  }
});


app.post("/scriptures/:singleEntryName/edit", async (req, res) => { //update
  const singleEntryName = req.params.singleEntryName; 
  const {title, content, date} = req.body;
  try {
    await Entry.findOneAndUpdate( {title: singleEntryName}, {title, content, date}, {new: true});
    console.log("Successfully Updated");
    res.redirect("/scriptures");
  } catch(err) {
    throw err;
  }
});

//------------editor route handling----------//
app.get("/composer/:categoryName", (req, res) => {
  res.sendFile(__dirname + "/views/compose.html");
});

app.get("/scriptures", passportSetup.isAuthenticated, async (req, res) => { //fetch all
  try {
    const entries = await Entry.find({ user: req.user._id}).sort({ date: -1 });
    let allUpdatedEntryInstances = entries.map((entry) => {
      let updatedEntryInstance = entryInstance.replace(/{@date@}/g, entry.date);
      if (entry.title.length >= 36) {
        updatedEntryInstance = updatedEntryInstance.replace(/{@title@}/g, entry.title.slice(0, 36) + "...");
      } else {
        updatedEntryInstance = updatedEntryInstance.replace(/{@title@}/g, entry.title.slice(0, 36));
      }
      updatedEntryInstance = updatedEntryInstance.replace(/{@id@}/g, entry._id);
      return updatedEntryInstance;
    });

    const populatedScripture = allUpdatedEntryInstances.join("");
    allPopulatedEntries = allEntries.replace(/{@entryInstance@}/g, populatedScripture);
    res.send(allPopulatedEntries);
  } catch (err) {
    throw err;
  }
});



app.post("/scriptures", async (req, res) => { //create
    try {
        await Entry.create({
            user: req.user._id,
            date: req.body.date,
            title: req.body.title,
            content: req.body.content
        });
        res.redirect("/scriptures");
    } catch(err) {
        throw err;
    }
}); 

app.post("/scriptures/:singleEntryName", async (req, res) => { //delete
  //disguised delete request
  const singleEntryName = req.params.singleEntryName;
  try {
    await Entry.findOneAndDelete({ _id: singleEntryName });
    console.log("Deleted Successfully");
    res.redirect("/scriptures");
  } catch (err) {
    throw err;
  }
});

//-------server--------//
app.listen(process.env.PORT || 3000);