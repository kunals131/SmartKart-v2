const User = require('../models/User')
const Cart = require('../models/Cart')
const bcrypt = require('bcrypt');
const AppError = require('../utils/appError')
const createToken = require('../utils/createToken');
const catchAsync = require('../utils/catchAsync');

exports.loginUser = catchAsync(async (req, res, next) => {
    let success = false;
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return next(
            new AppError('User Not Exists', 404)
        )
    }
    const passCompare = await bcrypt.compare(password, user.password)
    if (!passCompare) {
        return next(
            new AppError('Try Logging In with Correct Credentials', 404)
        )
    }
    success = true;
    const authToken = createToken(user)
    res.cookie('auth', authToken)
    res.status(200).json({ success, authToken, user });
})

exports.createUser = catchAsync(async (req, res, next) => {
    const { username, phone, email, password, role, businessName } = req.body;
    const checkMail = await User.find({ email })
    if (checkMail.length != 0) {
        return next(
            new AppError('Email Already Exists', 400)
        )
    }
    if (!(email && password)) {
        return next(
            new AppError('Please Provide Email and Password')
        )
    }
    const salt = await bcrypt.genSalt();
    const hashPass = await bcrypt.hash(password, salt);
    const newUser = new User({
        username,
        email,
        phone,
        role,
        businessName,
        password: hashPass
    })
    const user = await newUser.save();
    const items = new Cart({
        product: [],
        user: user.id
    })
    await items.save()
    res.status(201).json({ success: true, message: "Succesfully Created" });
})

exports.logoutUser = catchAsync((req, res, next) => {
    res.clearCookie('auth')
    res.json({ success: true, message: 'Logging Out' })
})

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
        return next(
            new AppError('User Not Found')
        )
    }
    res.json({ success: true, user })
})

exports.removeUser = catchAsync(async (req, res, next) => {
    const removedUser = await User.findByIdAndRemove(req.params.id)
    if (!removedUser) {
        return next(
            new AppError('Invalid User Id Provided')
        )
    }
    res.json({ success: true, message: "User removed Succesfully", removedUser })
})

exports.updateUser = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body)
    if (!updatedUser) {
        return next(
            new AppError('Invalid User Id Provided')
        )
    }
    res.json({ success: true, message: "User Updated Succesfully", updatedUser })
})