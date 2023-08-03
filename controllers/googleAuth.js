const passport = require("passport");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20");
const User = require(__dirname + "/../models/userSchema.js");

passport.serializeUser((user, done) => {
  done(null, user.id); //this is our cookie, it's a piece of information associated with a user
});

passport.deserializeUser((id, done) => {
  //destroying the cookie
  User.findById(id).then((user) => {
    done(null, user);
  });
});

passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const foundUser = await User.findOne({ email });
      if (foundUser) {
        const passwordMatch = await bcrypt.compare(password, foundUser.password);
        if (passwordMatch) {
          return done(null, foundUser);
        } else {
          return done(null, false, { message: "The password is wrong" });
        }
      } else {
        return done(null, false, { message: "User not found" });
      }
    } catch (err) {
      return done(err);
    }
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL:
        process.env.CALLBACK_URL,
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, done) => {
      const ifExists = await User.findOne({ googleId: profile.id });
      if (ifExists) {
        return done(null, ifExists);
      } else if (!ifExists) {
        const newGoogleUser = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
        });
        done(null, newGoogleUser);
      }
    }
  )
);

function isAuthenticated(req, res, next) {
  if(req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

module.exports = {passport, localStrategy: LocalStrategy, googleStrategy: GoogleStrategy, isAuthenticated};