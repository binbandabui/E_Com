const Category = require("../models/category");

const express = require("express");

const router = express.Router();
router.get(`/`, async (req, res) => {
  const categoryList = await Category.find();
  if (!categoryList) {
    res.status(404).json({ success: false });
  }
  res.status(200).send(categoryList);
});
router.post(`/`, async (req, res) => {
  const category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });
  try {
    const newCategory = await category.save();
    res.status(201).json(newCategory); // This line sends the response, so the next line should be removed.
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete(`/:id`, async (req, res) => {
  Category.findByIdAndDelete(req.params.id)
    .then((category) => {
      if (category) {
        return res
          .status(200)
          .json({ success: true, message: "the category was removed" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "category not found" });
      }
    })
    .catch((err) => {
      return res.status(400).json({ success: false, message: err });
    });
}),
  router.get("/:id", async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "category not found" });
    }
    res.status(200).send(category);
  }),
  router.put("/:id", async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "category not found" });
    }
    res.status(200).send(category);
  });

module.exports = router;
