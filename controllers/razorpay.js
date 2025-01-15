const razorpayInstance = require('../utils/utils');
const { Course, PurchasedCourse } = require('../models/db');
const { User } = require('../models/db');
const crypto = require('crypto');
const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;


exports.completePurchase = async (req, res) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, courseId, amount } = req.body;
  
      try {
          // Step 1: Verify the Razorpay signature
          const body = razorpay_order_id + "|" + razorpay_payment_id;
          const generatedSignature = crypto.createHmac('sha256', razorpaySecret)
                                            .update(body)
                                            .digest('hex');
  
          // Compare the generated signature with the received signature
          if (generatedSignature !== razorpay_signature) {
              console.error("Generated signature:", generatedSignature);
              return res.status(400).json({ error: 'Invalid signature' });
          }
  
          // Step 2: Ensure the user and course exist
          const user = await User.findById(userId);
          const course = await Course.findById(courseId);
  
          if (!user || !course) {
              return res.status(404).json({ error: 'User or Course not found' });
          }
  
          // Step 3: Create a new purchased course record
          const purchasedCourse = new PurchasedCourse({
              user: userId,
              course: courseId,
              paymentStatus: 'completed',
              transactionId: razorpay_payment_id,
              orderId: razorpay_order_id,
              signature: razorpay_signature,
              amount: amount,
              paymentMethod: 'razorpay'
          });
  
          // Save the purchased course record
          await purchasedCourse.save();
  
          // Optionally, update the user's purchased courses (embedding or referencing)
          user.purchasedCourses.push(purchasedCourse._id);
          await user.save();
  
          res.status(201).json({
              success: true,
              message: 'Course purchased successfully',
              purchasedCourse: purchasedCourse
          });
  
      } catch (error) {
          console.error('Error completing purchase:', error);
          res.status(500).json({ error: 'Failed to complete the purchase' });
      }
  };

exports.verifyPayment = async (req, res) => {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId } = req.body;
  
      try {
          const body = razorpayOrderId + "|" + razorpayPaymentId;
  
          const expectedSignature = crypto
              .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
              .update(body.toString())
              .digest('hex');
  
          if (expectedSignature !== razorpaySignature) {
              return res.status(400).json({ error: 'Invalid payment signature' });
          }
  
          // Add course to user's purchasedCourses
          const user = await User.findById(req.user.userId); // Ensure user is authenticated
          user.purchasedCourses.push(courseId);
          await user.save();
  
          res.status(200).json({ success: true, message: 'Payment verified and course unlocked' });
      } catch (error) {
          console.error('Payment verification failed:', error);
          res.status(500).json({ error: 'Payment verification failed' });
      }
  };

exports.createOrder = async (req, res) => {
      try {
          const { courseId } = req.body;
  
          // Fetch the course details from the database
          const course = await Course.findById(courseId);
  
          if (!course) {
              return res.status(404).json({ error: 'Course not found' });
          }
  
          // Create the Razorpay order
          const order = await razorpayInstance.orders.create({
              amount: course.price * 1, // Razorpay expects amount in paise (1 INR = 100 paise)
              currency: 'INR',
              receipt: `receipt_${courseId}`,
              notes: {
                  courseId: courseId,
              }
          });
  
          // Return the order details (orderId, amount) to the client
          res.status(201).json({
              success: true,
              orderId: order.id,
              amount: order.amount,
          });
      } catch (error) {
          console.error('Error creating order:', error);
          res.status(500).json({ error: 'Failed to create order' });
      }
  };

  exports.webhook = async (req, res) => {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const receivedSignature = req.headers['x-razorpay-signature'];
      const requestBody = JSON.stringify(req.body);
  
      // Verify the signature from Razorpay
      const generatedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(requestBody)
          .digest('hex');
  
      if (generatedSignature !== receivedSignature) {
          return res.status(400).json({ error: 'Invalid signature' });
      }
  
      // Process payment success here
      const { payload } = req.body;
      const { payment } = payload;
      const { entity: paymentEntity } = payment;
  
      const { order_id, payment_id, signature } = paymentEntity;
  
      // Extract additional details (userId, courseId, amount)
      const { userId, courseId, amount } = req.body;  // Assume these are sent with webhook or stored elsewhere
  
      // Use the same process as the route to store the payment in the database
      try {
          const user = await User.findById(userId);
          const course = await Course.findById(courseId);
  
          if (!user || !course) {
              return res.status(404).json({ error: 'User or Course not found' });
          }
  
          const purchasedCourse = new PurchasedCourse({
              user: userId,
              course: courseId,
              paymentStatus: 'completed',
              transactionId: payment_id,
              orderId: order_id,
              signature: signature,
              amount: amount,
              paymentMethod: 'razorpay'
          });
  
          await purchasedCourse.save();
          user.purchasedCourses.push(purchasedCourse._id);
          await user.save();
  
          res.status(200).json({ success: true, message: 'Payment processed via webhook' });
      } catch (error) {
          console.error('Error processing payment:', error);
          res.status(500).json({ error: 'Failed to process payment and update database' });
      }
  };
