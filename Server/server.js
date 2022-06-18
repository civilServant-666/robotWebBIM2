// require relevant modules
const http=require("http");
const url=require("url");
const querystring=require("querystring");
const path = require("path");
const fs = require("fs");
const {spawn} = require('child_process');
const express = require('express');

// Configure server IP
const ip = "147.8.133.35";
const app = express();
 
// HTTP server for 'get' request -- receive
app.get('/', function(req,res){
    if(req.url!=="/favicon.ico"){	    		
		var body=req.url;
		var queryStr=url.parse(body).query;
		var queryObj=querystring.parse(queryStr);
	       		
		// Test pass arguments to python subprocess 
        if (queryObj.reID==2){            
			console.log(queryObj.reID);
			console.log(queryObj.content);
            res.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"http://"+ip+":8080"});
			res.write("Test connection success");
            res.end();			
        } 
					
    }
});

app.listen(1337,ip,function(){

    console.log("Server created. Listening to " + ip + ":1337...");

});  