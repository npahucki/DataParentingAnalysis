exports.createParse = function () {
    var env = process.argv.length > 3 ? process.argv[2] : null;
    var masterKey = process.argv.length > 3 ? process.argv[3] : null;
    if ((env == "dev" || env == "prod") && masterKey != null) {
        var Parse = require('parse').Parse;
        var appId = env == "dev" ? "NlJHBG0NZgFS8JP76DBjA31MBRZ7kmb7dVSQQz3U" : "Vxvqum0HRF1NB00LEf2faaJYFzxd2Xh8hyrdY8MY";
        var jsKey = env == "dev" ? "Km9C7vBKrLdnDf8Uc3Zgf3qdw3qmbYa13R8RD1q2" : "1cFKBtgq3rYDfE55pc0KPhx3V3Yxby5i8n9NSwts";
        Parse.initialize(appId, jsKey, masterKey);
        Parse.Cloud.useMasterKey();
        return Parse;
    } else {
        console.log("ARGS" + masterKey + " " + env);
        throw "You must provide both the enviroment name [dev/prod] and the master key as arguments";
    }
};