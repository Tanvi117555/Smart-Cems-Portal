const crypto = require('crypto');

/**
 * Generate high-entropy registration code
 * Example: CEMS-2026-X8K4P2Q9
 */
const generateRegistrationCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Unambiguous uppercase alphanumeric
  let code = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  const year = new Date().getFullYear();
  return `CEMS-${year}-${code}`;
};

/**
 * Generate high-entropy certificate verification code
 * Example: CERT-2026-9A7F4B2C
 */
const generateCertificateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  const year = new Date().getFullYear();
  return `CERT-${year}-${code}`;
};

module.exports = {
  generateRegistrationCode,
  generateCertificateCode
};
