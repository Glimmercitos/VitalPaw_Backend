const admin = require('./firebaseAdmin');

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Token no provisto' });

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;  // UID Firebase del usuario
    next();
  } catch (error) {
    console.error('Token inválido:', error);
    return res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = verifyFirebaseToken;
