const mongoose = require("mongoose");

const busSchema = mongoose.Schema({
  order: { type: Number, required: true },
  date: { type: Date, required: true },
  bus: { type: Array, required: true },
  stop: { type: Object, required: true },
  route: { type: Object, required: true },
});

const Bus = mongoose.model("Bus", busSchema);

module.exports = Bus;
