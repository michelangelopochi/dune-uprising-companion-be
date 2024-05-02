const crypto = require('crypto');
require('dotenv').config();
const { ObjectId } = require('mongodb');

const encryptData = (data) => {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.SECRET_ID_CRYPT_KEY);
    var encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

const decryptData = (encryptedData) => {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.SECRET_ID_CRYPT_KEY);
    var decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const encryptId = (array) => {
    var newArray = [];
    for (const object of array) {
        var newObject = object["_doc"] ? object["_doc"] : object;
        if (newObject["_id"]) {
            newObject["_id"] = encryptData(newObject["_id"].toString());
        }
        newArray.push(newObject);
    }
    return newArray;
}

const decryptId = (array) => {
    console.log(array);
    var newArray = [];
    for (const id of array) {
        newArray.push(new ObjectId(decryptData(id)));
    }
    return newArray;
}

module.exports = { encryptId, decryptId };