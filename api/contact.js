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

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  let body;
  try {
    body = req.body || (await parseJsonBody(req));
  } catch (err) {
    sendJson(res, 400, { success: false, error: 'Invalid JSON body.' });
    return;
  }

  const { name, email, subject, message } = body || {};

  if (!name || !email || !subject || !message) {
    sendJson(res, 400, { success: false, error: 'All fields are required.' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || 'awaismeer019@gmail.com';
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>';

  if (!apiKey) {
    sendJson(res, 500, {
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
      sendJson(res, 502, { success: false, error: 'Email delivery failed.' });
      return;
    }

    sendJson(res, 200, { success: true, message: 'Message received.' });
  } catch (error) {
    console.error('Contact handler failed:', error);
    sendJson(res, 502, { success: false, error: 'Email delivery failed.' });
  }
};
