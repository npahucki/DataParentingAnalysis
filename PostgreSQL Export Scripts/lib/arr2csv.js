var jsesc = require('jsesc');

function parse(k, i, arr){
    if(String(typeof k) === 'string'){
        var r = k;
        if (k.indexOf(' ') != -1){
            //r = '"' + r.replace(/(["'])/g, "\\$1") + '"';
            r = jsesc(r, {'quotes': 'double', 'wrap': true});
        }
        else if (k.indexOf(',') != -1) {
            r = '"' + r + '"';
        }
        return r;
    }
    else if(k instanceof Date){
        return k.toISOString();
    }
    else{
        return k;
    }
}

var f = {
    toString: function(obj){
        var list = obj.map(parse);
        return String( list.join(',') + '\n' );
    }
}

module.exports = f;