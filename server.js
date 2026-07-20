const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;

function getEmailConfig() {
  return {
    contactToEmail: process.env.CONTACT_TO_EMAIL || 'awaismeer019@gmail.com',
    contactFromEmail: process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>',
    resendApiKey: process.env.RESEND_API_KEY,
  };
}

function getContentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function validatePayload(body) {
  if (!body || typeof body !== 'object') return 'Invalid payload';
  const { name, email, subject, message } = body;
  if (typeof name !== 'string' || name.trim().length < 2) return 'Name is required';
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Valid email is required';
  if (typeof subject !== 'string' || subject.trim().length < 3) return 'Subject is required';
  if (typeof message !== 'string' || message.trim().length < 10) return 'Message is required';
  return null;
}

async function sendWithResend(payload, config) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.contactFromEmail,
      to: [config.contactToEmail],
      reply_to: payload.email,
      subject: `Portfolio contact: ${payload.subject}`,
      html: `
        <h3>New portfolio enquiry</h3>
        <p><strong>Name:</strong> ${payload.name}</p>
        <p><strong>Email:</strong> ${payload.email}</p>
        <p><strong>Subject:</strong> ${payload.subject}</p>
        <hr />
        <p>${payload.message.replace(/\n/g, '<br />')}</p>
      `,
    }),
  });

  const result = await response.json().catch(() => null);
  return { response, result };
}

async function sendWithFormSubmit(payload) {
  const response = await fetch(`https://formsubmit.co/ajax/${payload.to || 'awaismeer019@gmail.com'}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
      _subject: `Portfolio contact: ${payload.subject}`,
      _template: 'table',
      _captcha: 'false',
    }),
  });

  const result = await response.json().catch(() => null);
  return { response, result };
}

function createServer() {
  return http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

    if (req.method === 'GET' && requestUrl.pathname === '/') {
      serveStaticFile(res, path.join(ROOT_DIR, 'index.html'));
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname.startsWith('/assets/')) {
      serveStaticFile(res, path.join(ROOT_DIR, requestUrl.pathname));
      return;
    }

    if (req.method === 'GET' && (requestUrl.pathname === '/style.css' || requestUrl.pathname === '/script.js')) {
      serveStaticFile(res, path.join(ROOT_DIR, requestUrl.pathname.slice(1)));
      return;
    }

    if (req.method === 'POST' && requestUrl.pathname === '/api/contact') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', async () => {
        let parsed;
        try {
          parsed = JSON.parse(body || '{}');
        } catch {
          sendJson(res, 400, { success: false, error: 'Invalid JSON' });
          return;
        }

        const validationError = validatePayload(parsed);
        if (validationError) {
          sendJson(res, 400, { success: false, error: validationError });
          return;
        }

        const config = getEmailConfig();

        try {
          if (config.resendApiKey) {
            const { response, result } = await sendWithResend(parsed, config);
            if (!response.ok) {
              console.error('Resend email failed:', result);
              throw new Error('Resend delivery failed');
            }
            console.log('Contact message sent via Resend:', result);
            sendJson(res, 200, {
              success: true,
              message: 'Message received. Thanks for contacting me.',
            });
            return;
          }

          const { response, result } = await sendWithFormSubmit({
            ...parsed,
            to: config.contactToEmail,
          });

          if (!response.ok) {
            console.error('FormSubmit delivery failed:', result);
            throw new Error('FormSubmit delivery failed');
          }

          console.log('Contact message sent via FormSubmit:', result);
          sendJson(res, 200, {
            success: true,
            message: 'Message received. Thanks for contacting me.',
          });
        } catch (error) {
          console.error('Contact email request failed:', error);
          sendJson(res, 502, {
            success: false,
            error: 'Email delivery failed. Please try again shortly.',
          });
        }
      });
      return;
    }

    sendJson(res, 404, { success: false, error: 'Not found' });
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`Contact server listening on http://127.0.0.1:${PORT}`);
  });
}

module.exports = { createServer, validatePayload };
