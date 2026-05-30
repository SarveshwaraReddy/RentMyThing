import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Item from "../src/models/Item.js";
import Rental from "../src/models/Rental.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const tenantId = "6a1aef3849d13cb3037941fa";

  const rentals = await Rental.find({ tenant: tenantId })
    .populate("item")
    .populate("owner", "name rating profileImage email")
    .populate("tenant", "name rating profileImage email")
    .sort({ createdAt: -1 });

  console.log("Rentals found:", rentals.length);
  rentals.forEach(r => {
    console.log(`ID: ${r._id} | Item: ${r.item ? r.item.title : 'null'} | Status: ${r.status}`);
  });

  await mongoose.connection.close();
}

run();
