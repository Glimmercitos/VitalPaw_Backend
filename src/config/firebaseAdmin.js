const admin = require('firebase-admin');
const serviceAccount = require('./vitalpaw-5bd88-firebase-adminsdk-fbsvc-b0d9af8b89.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
