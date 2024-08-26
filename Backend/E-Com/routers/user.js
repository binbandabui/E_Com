const expressJwt = require("express-jwt");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

function authJwt() {
  const secret = process.env.secret;

  const excludedPaths = new Set([
    "/api/v1/users/login",
    "/api/v1/users/register",
  ]);

  const excludedPathPatterns = [
    {
      pattern: /^\/api\/v1\/products(\/|$)/,
      methods: ["GET"],
    },
    {
      pattern: /^\/api\/v1\/category(\/|$)/,
      methods: ["GET"],
    },
    {
      pattern: /^\/public\/uploads(\/|$)/,
      methods: ["GET"],
    },
    {
      pattern: /^\/api\/v1\/users\/register(\/|$)/,
      methods: ["POST"],
    },
    {
      pattern: /^\/api\/v1\/users\/login(\/|$)/,
      methods: ["POST"],
    },
  ];

  return (req, res, next) => {
    if (excludedPaths.has(req.path)) {
      return next();
    }

    const isExcluded = excludedPathPatterns.some(
      ({ pattern, methods }) =>
        pattern.test(req.path) && methods.includes(req.method)
    );

    if (isExcluded) {
      return next();
    }

    expressJwt({
      secret,
      algorithms: ["HS256"],
      isRevoked: isRevoked,
    })(req, res, next);
  };
}

async function isRevoked(req, payload, done) {
  if (!payload.isAdmin) {
    return done(null, true);
  }
  done();
}

const router = express.Router();

router.get(`/`, async (req, res) => {
  try {
    const userList = await User.find().select("-passwordHash");
    if (!userList.length) {
      return res
        .status(404)
        .json({ success: false, message: "No users found" });
    }
    res.send(userList);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get(`/:id`, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User with id not found" });
    }
    res.send(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
    });
    const savedUser = await user.save();
    res.send(savedUser);
  } catch (error) {
    res.status(400).send("User not created: " + error.message);
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const secret = process.env.secret;
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
        {
          userId: user.id,
          isAdmin: user.isAdmin,
        },
        secret,
        { expiresIn: "1d" }
      );
      res.status(200).send({ user: user.email, token: token });
    } else {
      res.status(400).json({ message: "Invalid password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
    });
    const savedUser = await user.save();
    res.send(savedUser);
  } catch (error) {
    res.status(400).send("User not created: " + error.message);
  }
});

router.get("/get/count", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.send({ userCount: userCount });
  } catch (error) {
    res.status(404).json({ success: false, message: "No user found" });
  }
});

router.delete(`/:id`, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (user) {
      return res
        .status(200)
        .json({ success: true, message: "User was removed" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
