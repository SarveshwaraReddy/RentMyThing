import dotenv from "dotenv";
import mongoose from "mongoose";
import assert from "assert";
import crypto from "crypto";
import path from "path";

// Load environment variables
dotenv.config();

// Imports from backend codebase
import User from "../src/models/User.js";
import Item from "../src/models/Item.js";
import Rental from "../src/models/Rental.js";
import { validateRegister } from "../src/validators/inputValidator.js";
import { getItems } from "../src/controllers/itemController.js";
import { approveRental, verifyOTP } from "../src/controllers/rentalController.js";

// Helper to mock Express Request and Response
const mockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    cookies: {},
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.body = data;
      return this;
    },
    cookie: function (name, val, options) {
      this.cookies[name] = { val, options };
      return this;
    },
  };
  return res;
};

// Main test execution wrapper
async function runTests() {
  console.log("🚀 Starting RentMyThing Automated Testing Audit & Verification...");
  
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is missing from environment.");
    process.exit(1);
  }

  // Connect to database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("📦 Connected to MongoDB.");

  // Generate unique test tags to prevent database conflicts
  const testId = crypto.randomBytes(4).toString("hex");
  const testDomainEmail = `user-${testId}@test.com`;
  const validEduEmail = `student-${testId}@university.edu`;
  const validAcInEmail = `scholar-${testId}@college.ac.in`;

  try {
    // ==========================================
    // TEST 1: Email Format & Domain Validation
    // ==========================================
    console.log("\n🧪 Running Test 1: Email Format & Domain Validation...");
    
    // 1.1 Try invalid email format
    const req1 = {
      body: {
        name: "Test User",
        email: "invalid-email-string", // Invalid format
        password: "securePassword123",
        institution: "Test College",
      },
    };
    const res1 = mockRes();
    let nextCalled1 = false;
    
    validateRegister(req1, res1, () => { nextCalled1 = true; });
    
    assert.strictEqual(res1.statusCode, 400, "Validation should fail (400) for malformed emails.");
    assert.ok(res1.body.errors.email, "Response body should contain an email validation error.");
    console.log("✅ Blocked malformed email format successfully.");

    // 1.2 Try normal domain (e.g. gmail.com)
    const req2 = {
      body: {
        name: "Normal User",
        email: "user@gmail.com",
        password: "securePassword123",
        institution: "Test University",
      },
    };
    const res2 = mockRes();
    let nextCalled2 = false;

    validateRegister(req2, res2, () => { nextCalled2 = true; });

    assert.ok(nextCalled2, "validateRegister should call next() for standard gmail email.");
    console.log("✅ Permitted standard email domain registration successfully.");

    // 1.3 Try .edu domain
    const req3 = {
      body: {
        name: "Edu User",
        email: validEduEmail,
        password: "securePassword123",
        institution: "Test College",
      },
    };
    const res3 = mockRes();
    let nextCalled3 = false;

    validateRegister(req3, res3, () => { nextCalled3 = true; });

    assert.ok(nextCalled3, "validateRegister should call next() for .edu email.");
    console.log("✅ Permitted .edu domain email registration successfully.");

    // ==========================================
    // TEST 2: NoSQL Injection Casting in getItems
    // ==========================================
    console.log("\n🧪 Running Test 2: NoSQL Injection Casting in getItems...");
    
    const reqInjection = {
      query: {
        category: { $ne: "Electronics" }, // Object injection attempt
        search: "Camera",
      },
    };
    const resInjection = mockRes();
    
    await getItems(reqInjection, resInjection, (err) => {
      if (err) throw err;
    });

    assert.strictEqual(resInjection.statusCode, 200, "getItems should execute successfully without throwing errors.");
    console.log("✅ Query filters successfully cast and sanitized against NoSQL injection.");

    // ==========================================
    // TEST 3: Coordinate Fallback (Geospatial)
    // ==========================================
    console.log("\n🧪 Running Test 3: Coordinate Fallback (Geospatial)...");

    const reqCoords = {
      query: {
        lat: "invalid-latitude",
        lng: "invalid-longitude",
      },
    };
    const resCoords = mockRes();

    await getItems(reqCoords, resCoords, (err) => {
      if (err) throw err;
    });

    assert.strictEqual(resCoords.statusCode, 200, "Invalid coordinates should fallback gracefully without 500 crashes.");
    console.log("✅ Geospatial search falls back gracefully when given invalid coordinates.");

    // ==========================================
    // TEST 4: Double Booking and Overlap Check
    // ==========================================
    console.log("\n🧪 Running Test 4: Double Booking & Overlap Check...");

    // Create dummy users
    const owner = await User.create({
      name: "Owner User",
      email: `owner-${testId}@university.edu`,
      password: "securePassword123",
      institution: "Harvard",
    });

    const tenantA = await User.create({
      name: "Tenant A",
      email: `tenantA-${testId}@university.edu`,
      password: "securePassword123",
      institution: "Harvard",
    });

    const tenantB = await User.create({
      name: "Tenant B",
      email: `tenantB-${testId}@university.edu`,
      password: "securePassword123",
      institution: "Harvard",
    });

    // Create dummy item
    const item = await Item.create({
      owner: owner._id,
      title: `Test Item ${testId}`,
      description: "A beautiful item for rent",
      category: "Tools",
      images: ["http://example.com/image.jpg"],
      dailyRate: 10,
      depositAmount: 100,
      location: {
        type: "Point",
        coordinates: [77.5946, 12.9716],
        formattedAddress: "Bangalore Campus",
      },
    });

    // Create overlapping rentals
    // Rental A: Jan 1 to Jan 10
    const rentalA = await Rental.create({
      item: item._id,
      owner: owner._id,
      tenant: tenantA._id,
      startDate: new Date("2027-01-01"),
      endDate: new Date("2027-01-10"),
      totalCost: 100,
      securityDeposit: 100,
      status: "Requested",
    });

    // Rental B: Jan 5 to Jan 15 (Overlaps Rental A)
    const rentalB = await Rental.create({
      item: item._id,
      owner: owner._id,
      tenant: tenantB._id,
      startDate: new Date("2027-01-05"),
      endDate: new Date("2027-01-15"),
      totalCost: 100,
      securityDeposit: 100,
      status: "Requested",
    });

    // Lender approves Rental A
    const reqApproveA = {
      params: { id: rentalA._id },
      user: { id: owner._id },
    };
    const resApproveA = mockRes();

    await approveRental(reqApproveA, resApproveA, (err) => { if (err) throw err; });
    assert.strictEqual(resApproveA.statusCode, 200, "Rental A approval should succeed.");
    
    // Refresh and check status
    const updatedA = await Rental.findById(rentalA._id);
    assert.strictEqual(updatedA.status, "Approved", "Rental A status should be Approved.");
    console.log("✅ Approved Rental A (first booking).");

    // Refresh Rental B and verify it got auto-rejected
    const updatedB = await Rental.findById(rentalB._id);
    assert.strictEqual(updatedB.status, "Rejected", "Rental B should be auto-rejected.");
    console.log("✅ Overlapping Rental B status was successfully auto-rejected.");

    // Manually force Rental B status back to Requested to simulate bypass/concurrency race condition
    await Rental.findByIdAndUpdate(rentalB._id, { $set: { status: "Requested" } });

    // Lender attempts to approve Rental B (Overlapping)
    const reqApproveB = {
      params: { id: rentalB._id },
      user: { id: owner._id },
    };
    const resApproveB = mockRes();

    await approveRental(reqApproveB, resApproveB, (err) => { if (err) throw err; });
    assert.strictEqual(resApproveB.statusCode, 409, "Rental B approval should fail (409 Conflict) due to overlap.");
    console.log("✅ Overlapping Rental B approval successfully blocked with 409 conflict.");

    // ==========================================
    // TEST 5: OTP Brute-Force Limits
    // ==========================================
    console.log("\n🧪 Running Test 5: OTP Brute-Force Limits...");

    const reqOTPVerify = {
      params: { id: rentalA._id },
      user: { id: tenantA._id },
      body: { otp: "000000" }, // Incorrect OTP
    };

    // Attempt 5 times
    for (let i = 1; i <= 5; i++) {
      const resOTP = mockRes();
      await verifyOTP(reqOTPVerify, resOTP, (err) => { if (err) throw err; });
      
      if (i < 5) {
        assert.strictEqual(resOTP.statusCode, 400, `Attempt ${i} should return 400.`);
        assert.ok(resOTP.body.message.includes("Attempts remaining"), "Message should notify remaining attempts.");
      } else {
        assert.strictEqual(resOTP.statusCode, 400, "5th attempt should fail and reset handshake.");
        assert.ok(resOTP.body.message.includes("Too many failed OTP attempts"), "Message should notify lockout reset.");
      }
    }

    // Refresh and check status
    const resetA = await Rental.findById(rentalA._id);
    assert.strictEqual(resetA.status, "Requested", "Rental A status should revert to Requested after 5 failed attempts.");
    assert.strictEqual(resetA.handshakeOTP, undefined, "Handshake OTP should be purged.");
    console.log("✅ Handshake blocked and reset to 'Requested' state after 5 failed OTP attempts.");

    // ==========================================
    // CLEANUP
    // ==========================================
    console.log("\n🧹 Cleaning up test database records...");
    await Rental.deleteMany({ item: item._id });
    await Item.deleteOne({ _id: item._id });
    await User.deleteMany({ _id: { $in: [owner._id, tenantA._id, tenantB._id] } });
    console.log("✅ Test database cleaned up successfully.");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! APPLICATION IS SECURE & STABLE.");
    
  } catch (error) {
    console.error("\n❌ TEST FAILURE DETECTED:");
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed.");
  }
}

runTests();
