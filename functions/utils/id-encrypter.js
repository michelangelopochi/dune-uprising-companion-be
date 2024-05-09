import crypto from "crypto";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";

dotenv.config();

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.SECRET_ID_CRYPT_KEY, 'GfG', 32)
const iv = Buffer.alloc(16, 0);

export function encryptData(data) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    var encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

export function decryptData(encryptedData) {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export function encryptId(array) {
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

export function decryptId(array) {
    console.log(array);
    var newArray = [];
    for (const id of array) {
        newArray.push(new ObjectId(decryptData(id)));
    }
    return newArray;
}