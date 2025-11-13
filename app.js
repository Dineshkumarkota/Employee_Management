const express = require('express');
const app = express();
const dotenv = require("@dotenvx/dotenvx");

dotenv.config({ path: "./.env", envKeysFile: './.env.keys' });
app.use(express.json());
const routes = require('./routes/app');

app.use('/', routes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
})