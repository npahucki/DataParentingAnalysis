var Parse=require("Parse").Parse
var _=require("underscore")
var fs=require("fs")


var today = new Date().toISOString().
        replace(/T/, ' ').
        replace(/\..+/, '').
        replace(/\s\d{2}:\d{2}:\d{2}/,'');
var pathToBackupDir="/tmp/parse-backup-for-"+today

var fs = require('fs');
var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

deleteFolderRecursive(pathToBackupDir);