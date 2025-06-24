const admin = require('firebase-admin');
const serviceAccount = require('./vitalpaw-d5213-firebase-adminsdk-fbsvc-5dae68ce0f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
