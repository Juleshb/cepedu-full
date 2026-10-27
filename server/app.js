
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const prisma = require("./config/db");
require("dotenv").config();

const userRoutes = require('./routes/userRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const loanRoutes = require('./routes/loanRoutes');
const loanRepaymentRoutes = require('./routes/loanRepaymentRoutes');
const adminLogRoutes = require('./routes/adminLogRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

app.use(morgan("dev"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/loan-repayments', loanRepaymentRoutes);
app.use('/api/admin-logs', adminLogRoutes);
app.use('/api/messages', messageRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
      status: "200",
      author: "Hb-lab",
      message: "Most welcome to our API",
    });
  });
  
  prisma.$connect()
    .then(() => {
      console.log("Connected to the database successfully.");
  
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} 🔥🔥🔥`);
      });
    })
    .catch((error) => {
      console.error("Failed to connect to the database:", error.message);
      process.exit(1);
    });
  
  module.exports = app;
