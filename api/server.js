export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { email, tag } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const API_KEY = process.env.MAILCHIMP_API_KEY;
    const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
    const SERVER = process.env.MAILCHIMP_SERVER_PREFIX;

    const url = `https://${SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`;
    const TAGS= 'test tag'

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `apikey ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email_address: email,
                status: "subscribed", // or "pending" for double opt-in
                tags: TAGS,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(400).json({
                message: data.detail || "Mailchimp error",
            });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}
