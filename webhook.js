/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(bodyParser.json());


app.post('/webhook', (req, res) => {
    if (req.headers['x-github-event'] === 'push') {
        const repoPath = '/root/Game-Gauntlet-Server';
        const commands = `
            cd ${repoPath} &&
            git pull &&
            npm install &&
            npm run build &&
            pm2 restart nest-server
        `;

        exec(commands, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error: ${stderr}`);
                return res.sendStatus(500);
            }
            console.log(`Output: ${stdout}`);
            res.sendStatus(200);
        });
    } else {
        res.sendStatus(400);
    }
});

app.listen(3000, () => {
    console.log('Webhook listener running on port 3000');
});
