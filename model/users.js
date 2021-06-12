//consider implementing http://www.passportjs.org/, could be usefull to login with facebook o gmail

const bcrypt = require("bcrypt-nodejs");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const SALT_FACTOR = 10;
const userSchema = Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: true,
        validate: {
            validator: (val) => {
                return val.length >= 6;
            },
            message: "La contraseña debe tener al menos 6 caracteres"
        }
    },
    createdAt: { type: Date, default: Date.now },
    recoveryKey: {
        key: String,
        createdAt: Date,
    },
});

const noop = function () { };
userSchema.pre("save", function (done) {
    var user = this;
    if (!user.isModified("password")) {
        return done();
    }
    bcrypt.genSalt(SALT_FACTOR, function (err, salt) {
        if (err) { return done(err); }
        bcrypt.hash(user.password, salt, noop, function (err, hashedPassword) {
            if (err) { return done(err); }
            user.password = hashedPassword;
            done();
        });
    });
});

userSchema.methods.checkPassword = function (guess, done) {
    bcrypt.compare(guess, this.password, function (err, isMatch) {
        done(err, isMatch);
    });
};

userSchema.methods.name = function () {
    return this.displayName || this.username;
};

userSchema.statics.dto = function (dao) {
    return { id: dao.id, email: dao.email, username: dao.username, createdAt: dao.createdAt };
};


module.exports = mongoose.model("User", userSchema);