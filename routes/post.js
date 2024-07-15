const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/user');
const Post = require('../models/post');

const cloudinary = require('../utils/cloudinary');
const uploader = require("../utils/multer");
const { sendOTP } = require('../utils/nodemailer');

const route = express.Router();

//  endpoint for user to create a post
route.post('/create_post', uploader.single("image"), async (req, res) => {
    const { token, user_img_url, post_text } = req.body; // Destructuring the request body

    // Checking if any required field is missing
    if (!token) {
        return res.status(400).send({ status: "error", msg: "all fields must be filled" });
    }

    try {
        // token verification
        const user = jwt.verify(token, process.env.JWT_SECRET);

        let post_url, post_id;
        // check if image was sent in and upload to cloudinary
        if(req.file) {
            // folder is used to specify the folder name you want the image to be saved in
            const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {folder: 'profile-images'});
            post_url = secure_url;
            post_id = public_id;
        }
        
        // create post document
        const post = new Post();
        post.username = user.username;
        post.user_id = user._id;
        post.post_text = post_text || "";
        post.user_img_url = user_img_url || "";
        post.post_url = post_url || "";
        post.post_id = post_id || "";
        post.comments = [];
        post.likes = [];
        post.timestamp = Date.now();

        // save my document on mongodb
        await post.save();

        await User.updateOne({_id: user._id}, {
            $push: {posts: post._id},
            $inc: {post_count: 1}
        });

        return res.status(200).send({status: 'ok', msg: 'success', post});

    } catch (error) {
        console.error(error);
        // Sending error response if something goes wrong
        res.status(500).send({ status: "some error occurred", msg: error.message });
    }
});

// endpoint to view user account posts
route.post('/view_user_posts', async (req, res) => {
    const {token } = req.body; // Destructuring the request body

    // Checking if any required field is missing
    if (!token ) {
        return res.status(400).send({ status: "error", msg: "all fields must be filled" });
    }

    try {
        // token verification
        const user = jwt.verify(token, process.env.JWT_SECRET);

        // fetch post documents
        const posts = await Post.find({user_id: user._id}).sort({timestamp: -1}).lean();

        return res.status(200).send({status: 'ok', msg: 'success', posts});

    } catch (error) {
        console.error(error);
        // Sending error response if something goes wrong
        res.status(500).send({ status: "some error occurred", msg: error.message });
    }
});

// endpoint to edit post
route.post('/edit_post', async (req, res) => {
    const {token, post_id, post_text } = req.body; // Destructuring the request body

    // Checking if any required field is missing
    if (!token || !post_id || !post_text ) {
        return res.status(400).send({ status: "error", msg: "all fields must be filled" });
    }

    try {
        // token verification
        jwt.verify(token, process.env.JWT_SECRET);

        // edit post document
        const post = await Post.findByIdAndUpdate({_id: post_id}, {post_text: post_text}, {new: true}).lean();

        return res.status(200).send({status: 'ok', msg: 'success', post});

    } catch (error) {
        console.error(error);
        // Sending error response if something goes wrong
        res.status(500).send({ status: "some error occurred", msg: error.message });
    }
});

module.exports = route;
