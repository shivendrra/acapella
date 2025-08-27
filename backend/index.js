// imports
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env' });
require('./models/database');

const ORIGIN_1 = process.env.ALLLOWED_ORIGIN_1;
const ORIGIN_2 = process.env.ALLLOWED_ORIGIN_2;
const ORIGIN_3 = process.env.ALLLOWED_ORIGIN_3;
const allowedOrigins = [ORIGIN_1, ORIGIN_2, ORIGIN_3];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Synapse Music API');
});

module.exports = app;