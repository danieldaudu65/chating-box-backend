const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/user');

const cloudinary = require('../utils/cloudinary');
const uploader = require("../utils/multer");
const { decryptObject, encryptObject } = require('../encrypt');

const route = express.Router();


/**
 * Endpoint to add card details
 * @param {object} card_details the object that stores the card details
 * format: {
      card_number: Number,
      holders_name: String,
      mm_yy: String,
      cvv: Number
    }
 */
route.post("/add_card", async (req, res) => {
    const { token, card_details } = req.body;

    if (!token || !card_details) {
        return res.status(400).send({ status: "error", msg: "required fields must be filled" });
    }

    try {
        // token verification
        const user = jwt.verify(token, process.env.JWT_SECRET);

        // fetch initial user card details and decrypt it if any
        const userM = await User.findById({ _id: user._id }, { card_details: 1 }).lean();
        if (userM.card_details) {
            // decrypt card details
            let decrypted_card_details = decryptObject(userM.card_details, process.env.MINIPROJECT_DIGITS);
            decrypted_card_details.push(card_details);

            // encrypt card details and update the user document
            const encrypted_card_details = encryptObject(decrypted_card_details, process.env.MINIPROJECT_DIGITS);
            await User.updateOne({ _id: user._id }, { card_details: encrypted_card_details });

            return res.status(200).send({ status: "ok", msg: "success", card_details: decrypted_card_details });
        }

        // encrypt card details and update the user document
        const encrypted_card_details = encryptObject([card_details], process.env.MINIPROJECT_DIGITS);

        await User.updateOne({ _id: user._id }, { card_details: encrypted_card_details });

        return res.status(200).send({ status: "ok", msg: "success", card_details: [card_details] });
    } catch (e) {
        console.error(e);
        if (e.name === 'JsonWebTokenError')
            return res.status(401).send({ status: "error", msg: "Token verification failed" });

        return res.status(500).send({ status: "error", msg: "An error occured" });
    }
});

// endpoint to view card details
route.post("/view_card_details", async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).send({ status: "error", msg: "required fields must be filled" });
    }

    try {
        // token verification
        const user = jwt.verify(token, process.env.JWT_SECRET);

        // fetch initial user card details
        const { card_details } = await User.findById({ _id: user._id }, { card_details: 1 }).lean();

        // check if user has card details
        if (!card_details)
            return res.status(200).send({ status: "ok", msg: "no card details for this user", count: 0 });

        // decrypt card details
        let decrypted_card_details = decryptObject(card_details, process.env.MINIPROJECT_DIGITS);

        return res.status(200).send({ status: "ok", msg: "success", card_details: decrypted_card_details, count: decrypted_card_details.length });

    } catch (e) {
        console.error(e);
        if (e.name === 'JsonWebTokenError')
            return res.status(401).send({ status: "error", msg: "Token verification failed" });

        return res.status(500).send({ status: "error", msg: "An error occured" });
    }
});

module.exports = route;