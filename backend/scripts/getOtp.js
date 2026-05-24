#!/usr/bin/env node
const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/getOtp.js <email>");
  process.exit(2);
}

if (!MONGODB_URI) {
  console.error("MONGODB_URI not set in environment.");
  process.exit(2);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const otp = await mongoose.connection.db
    .collection("otps")
    .findOne(
      { email, type: "email_verification" },
      { sort: { createdAt: -1 } },
    );
  if (!otp) {
    console.error("OTP not found for", email);
    process.exit(1);
  }
  console.log("OTP:", otp.otp);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
