const express = require('express');
const { httpLogger } = require('./middlewares');
const { logger } = require('./utils');

const app = express();
const port = 3000;


app.use(httpLogger);

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => {
  logger.info(`Server listening on port ${port}!`);
});
