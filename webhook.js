/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

app.get('/webhook', (req, res) => {
  const secret = 'your_secret';
  const signature = req.headers['x-hub-signature-256'];

  const hash = `sha256=${crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex')}`;
  if (!signature || signature !== hash) {
    return res.status(403).send('Forbidden');
  }

  exec('cd /path/to/your/repo && git pull && npm run build && pm2 restart your_app', (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${stderr}`);
      return res.status(500).send('Internal Server Error');
    }
    console.log(`Output: ${stdout}`);
    res.status(200).send('OK');
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});