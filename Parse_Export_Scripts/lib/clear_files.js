var Parse=require("Parse").Parse
var _=require("underscore")
var fs=require("fs")


module.exports.perform = function(){
    var promise = new Parse.Promise();
    if (1){
        return main();
    }
    else{
        promise.reject("Missing env variables, maybe? note that we need these: env['S3_CLIENT_KEY'] && env['S3_SECRET_KEY'] && env['PARSE_API_KEY'] && env['PARSE_JS_KEY'] && env['PARSE_MASTER_KEY'] && env['MAILGUN_KEY']");
    }
    return promise;
}

//Returns Parse.Promise
function main(){
	var promise= new Parse.Promise();
	var dir = __dirname.substring(0, __dirname.lastIndexOf('/'));
	var tables = fs.readdirSync(dir);
	tables=_.filter(tables, function(fileName){
        return (fileName.split('.').pop()=="json" || fileName.split('.').pop()=="csv") && fileName!="package.json"
    })
    var promises=[]
    _.each(tables, function(fileName){
    	var path=__dirname.substring(0, __dirname.lastIndexOf('/'))+"/"+fileName
    	console.log(path)
    	promises.push(deleteFile(path))
    })
    Parse.Promise.when(promises).then(function(){
    	promise.resolve();
    	console.log("Files cleared.")
    })
    return promise;
}

/***
 *
 * @param fileName
 * @returns Parse.Promise
 */
function deleteFile(fileName){
    var promise = new Parse.Promise();
    fs.unlink(fileName, function (err) {
        if (err){
            promise.reject(err);
        }
        else{
            promise.resolve(fileName);
        }
    });
    return promise;
}