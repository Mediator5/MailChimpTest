import nodemailer from "nodemailer";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { email, tag, fname, lname, phone, etype } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const API_KEY = process.env.MAILCHIMP_API_KEY;
    const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
    const SERVER = process.env.MAILCHIMP_SERVER_PREFIX;

    const MAIL_URL = `https://${SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`;

    try {
        /* 1️⃣ Add subscriber to Mailchimp */
        const mcResponse = await fetch(MAIL_URL, {
            method: "POST",
            headers: {
                Authorization: `apikey ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email_address: email,
                status: "subscribed",          // or "pending" for double opt-in
                tags: tag ? [tag] : [],
                merge_fields: {
                    FNAME: fname || "",
                    LNAME: lname || "",
                    PHONE: phone || "",
                    ETYPE: etype || "",
                },
            })
        });

        const mcData = await mcResponse.json();

        if (!mcResponse.ok) {
            return res.status(400).json({
                message: mcData.detail || "Mailchimp error",
            });
        }

        /* 2️⃣ Send Gmail notification */
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"New Lead" <${process.env.GMAIL_USER}>`,
            to: "fiyinfolumdtv@gmail.com",
            subject: "📩 New Form Submission",
            text: `New lead submitted:\n\nEmail: ${email}\nTag: ${tag || "N/A"}`,
            html: `
        <h2>New Form2 Submission</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Tag:</strong> ${tag || "N/A"}</p>
      `,
        });

        // return res.status(200).json({ success: true });
        return res.redirect(302, "/thank-you.html");

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}
