const Order = require("../models/order");
const { OrderItem } = require("../models/order-item"); // Ensure this import is correct

const express = require("express");

const router = express.Router();
//control
router.get(`/`, async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name")
    .sort({ dateCreated: -1 });
  if (!orderList) {
    res.status(404).json({ success: false });
  }
  res.send(orderList);
});
router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    // .populate("orderItems");
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });

  if (!order) {
    return res.status(404).json({ success: false });
  }
  res.send(order);
});
router.post(`/`, async (req, res) => {
  try {
    // Handle async operations with Promise.all
    const orderItemIds = await Promise.all(
      req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
          quantity: orderItem.quantity,
          product: orderItem.product,
        });
        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
      })
    );

    // Calculate total price
    const totalPrices = await Promise.all(
      orderItemIds.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate(
          "product",
          "price"
        );
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
      })
    );
    console.log(totalPrices);
    // Summing up the total prices
    const total = totalPrices.reduce((a, b) => a + b, 0);

    // Create and save the new order
    let order = new Order({
      orderItems: orderItemIds, // Ensure the field name matches the schema
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2,
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
      phone: req.body.phone,
      status: req.body.status,
      totalPrice: total, // Use the calculated total price
      user: req.body.user,
    });

    order = await order.save();

    if (!order) return res.status(404).json("Order not found");

    res.send(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    {
      new: true,
    }
  );
  if (!order) {
    return res.status(404).json({ success: false, message: "order not found" });
  }
  res.status(200).send(order);
});
router.delete(`/:id`, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (order) {
      // Loop through the orderItems and delete each one
      await Promise.all(
        order.orderItems.map(async (orderItem) => {
          await OrderItem.findByIdAndDelete(orderItem);
        })
      );

      return res
        .status(200)
        .json({ success: true, message: "Order and associated items deleted" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
//admin
router.get("/get/totalsales", async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalsales: { $sum: "$totalPrice" } } },
  ]);
  if (!totalSales) {
    return res.status(404).json({ success: false, message: "No sales found" });
  }
  res.send({ totalsales: totalSales.pop().totalsales });
});
router.get("/get/count", async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found" });
    }
    res.status(200).json({ success: true, orderCount: orderCount });
  } catch (error) {
    console.error("Error fetching product count:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// read user order
router.get(`/get/userorders/:userid`, async (req, res) => {
  const userorderList = await Order.find({ user: req.params.userid })
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .sort({ dateCreated: -1 });
  if (!userorderList) {
    res.status(404).json({ success: false });
  }
  res.send(userorderList);
});
module.exports = router;
