const CryptoJS = require('crypto-js');
const dotenv = require('dotenv');
dotenv.config();

// Function to encrypt an object
function encryptObject(object, key) {
  const jsonString = JSON.stringify(object);
  const ciphertext = CryptoJS.AES.encrypt(jsonString, key).toString();
  return ciphertext;
}

// Function to decrypt an object
function decryptObject(ciphertext, key) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const jsonString = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(jsonString);
}

// // Example usage
// const originalObject = [{ message: 'Hello, World!', user: 'Alice' }, { message: 'Wsp', user: 'Tunde' }];
// const encryptionKey = process.env.MINIPROJECT_DIGITS;

// // Encrypt the object
// const encryptedData = encryptObject(originalObject, encryptionKey);
// console.log('Encrypted:', encryptedData);

// // Decrypt the object
// const decryptedObject = decryptObject(encryptedData, encryptionKey);
// console.log('Decrypted:', decryptedObject);

module.exports = {
  encryptObject,
  decryptObject
}