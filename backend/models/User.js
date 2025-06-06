import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const usernameRegex = /^[A-Za-z0-9_]{1,20}$/;
const nameRegex = /^[A-Za-zÀ-ÿ'’.\-\s]{1,50}$/u;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_+={}|\\;:"<>?,./]).{8,32}$/;

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: function () {return this.active === true},
        unique: true,
        sparse: true,
        minLength: 3,
        maxLength: 20,
        match: [usernameRegex, 'Username must be 3-20 characters long, must contain only letters, numbers and underscores.']
    },
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 50,
        match: [nameRegex, 'The first name must be 3-50 characters long, must contain only letters, apostrophes, dots, dashes and spaces.']
    },
    lastName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 50,
        match: [nameRegex, 'The last name must be 3-50 characters long, must contain only letters, apostrophes, dots, dashes and spaces..']
    },
    email: {
        type: String,
        required: function () {return this.active === true},
        unique: true,
        sparse: true,
        maxLength: 100,
        match: [emailRegex, 'Invalid email address.']
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
        maxLength: 32,
        match: [passwordRegex, 'The password must be 8-32 characters long, must contain at least a lower case letter, an uppercase letter, a number and a special character.']
    },
    type: {
        type: String,
        enum: ['customer', 'owner'],
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
})

// accetta confirmPassword da usare poi per il confronto
UserSchema.virtual('confirmPassword')
    .get(function () {
        return this._confirmPassword;
    })
    .set(function (value) {
        this._confirmPassword = value;
    });

// confronto tra password e confirmPassword
UserSchema.pre('validate', function (next) {
    if (this.isNew && this.password !== this.confirmPassword) {
        this.invalidate('confirmPassword', 'The passwords don\'t match.');
    }
    next();
});

// hash della password prima di salvarla
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const User = mongoose.model('User', UserSchema);
export default User;