export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { message, category } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }

    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
        return res.status(500).json({ message: 'Server configuration error: WEBHOOK_URL not set' });
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: `**New Feedback**\n\n**Category:** ${category || 'General'}\n**Message:**\n${message}`,
                username: "FDert Feedback Bot"
            }),
        });

        if (response.ok) {
            return res.status(200).json({ message: 'Feedback sent successfully' });
        } else {
            const errorText = await response.text();
            console.error('Webhook error:', errorText);
            return res.status(500).json({ message: 'Failed to send feedback to webhook' });
        }
    } catch (error) {
        console.error('Feedback handler error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
