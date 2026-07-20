function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const handler = async function (req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (!body) {
    try {
      body = await parseJsonBody(req);
    } catch (err) {
      res.status(400).json({ success: false, error: 'Invalid JSON body.' });
      return;
    }
  }

  const { name, email, subject, message } = body || {};

  if (!name || !email || !subject || !message) {
    res.status(400).json({ success: false, error: 'All fields are required.' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || 'awaismeer019@gmail.com';
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>';

  if (!apiKey) {
    res.status(500).json({
      success: false,
      error: 'Email service is not configured yet. Add RESEND_API_KEY in Vercel.',
    });
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `Portfolio contact: ${subject}`,
        html: `
          <h3>New portfolio enquiry</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr />
          <p>${message.replace(/\n/g, '<br />')}</p>
        `,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('Resend failed:', result);
      res.status(502).json({ success: false, error: 'Email delivery failed.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Message received.' });
  } catch (error) {
    console.error('Contact handler failed:', error);
    res.status(502).json({ success: false, error: 'Email delivery failed.' });
  }
};

module.exports = handler;
module.exports.default = handler;
