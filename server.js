require("dotenv").config();
const nodemailer = require("nodemailer");
const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");


const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/create-checkout-session", async (req, res) => {
  const { items } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map(item => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: "http://localhost:3000/success.html",
      cancel_url: "http://localhost:3000/index.html",
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Servidor en http://localhost:3000"));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS
    
  }
});

app.post("/send-message", async (req, res) => {

  console.log("Mensaje recibido:", req.body);

  const { name, email, message } = req.body;

  const mailOptions = {
    from: email,
    to: "mihasposssposs@gmail.com",
    subject: "Nuevo mensaje desde Legendary Racing Keychain",
    text: `
Nombre: ${name}
Email: ${email}

Mensaje:
${message}
`
  };

  await transporter.sendMail(mailOptions);

  res.send("Mensaje enviado correctamente");

});
