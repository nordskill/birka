import crypto from 'crypto';
import util from 'util';

// Promisify the pbkdf2 function to use it with async/await
const pbkdf2Async = util.promisify(crypto.pbkdf2);

const saltLength = 16;
const iterations = 10000;
const keylength = 64;
const digest = 'sha512';

async function hashPassword(password) {

    const salt = crypto.randomBytes(saltLength).toString('hex');
    const derivedKey = await pbkdf2Async(password, salt, iterations, keylength, digest);
    return `${salt}:${derivedKey.toString('hex')}`;

}

async function verifyPassword(password, hash) {

    const [salt, key] = hash.split(':');
    const derivedKey = await pbkdf2Async(password, salt, iterations, keylength, digest);
    return key === derivedKey.toString('hex');

}

export { hashPassword, verifyPassword };
