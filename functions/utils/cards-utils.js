import dotenv from "dotenv";

dotenv.config();

export function changeCardParams(cards) {
    var newArray = [];
    for (const object of array) {
        var newObject = object["_doc"] ? object["_doc"] : object;
        if (newObject["img"]) {
            //temp
            if (!newObject["img"].contains("dune-uprising-companion-api.s3.eu-west-3.amazonaws.com"))
                newObject["img"] = process.env.AWS_BUCKET_CARD_PATH + "/" + object["img"];
            else {
                newObject["img"] = object["img"].replace("-api.s3", "-app.s3");
            }
        }
        newArray.push(newObject);
    }
    return newArray;
}