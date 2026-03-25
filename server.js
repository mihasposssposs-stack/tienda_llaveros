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

// ── Stripe Checkout ──────────────────────────────────────────
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
      // ✅ Cambia esto por la URL real de tu web en Render
      success_url: `${https://tienda-llaveros.onrender.com/}/success.html`,
      cancel_url: `${https://tienda-llaveros.onrender.com/}/index.html`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── Nodemailer transporter ───────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ── Contacto ─────────────────────────────────────────────────
app.post("/send-message", async (req, res) => {
  console.log("Mensaje recibido:", req.body);

  const { name, email, message } = req.body;

  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`, // ✅ Gmail requiere que el from sea tu propia cuenta
    replyTo: email,                                 // ✅ Al responder, irá al email del cliente
    to: process.env.EMAIL_USER,                     // ✅ Te lo mandas a ti mismo
    subject: `Nuevo mensaje de ${name} — Legendary Racing Keychains`,
    text: `
Nombre: ${name}
Email: ${email}

Mensaje:
${message}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send("Mensaje enviado correctamente");
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── Servidor ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
