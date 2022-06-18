// require relevant modules
var http=require("http");
var url=require("url");
var querystring=require("querystring");
var path = require("path");
var fs = require("fs");
var xlsx = require("node-xlsx");
var exec = require('child_process').exec;  // import command line execution module, so as to triger python file in node.js

// Configure server IP
var ip = "147.8.147.135";

//define variable to contain class cofig_info and historical annotation results;
var curRow = 1;
var imgParaList = ext_excel("./DefectFolder/preciseCamParams.xlsx", 1);
var defectPCList = ext_excel("./DefectFolder/defectInfo.xlsx", 1);
//console.log(defectPCList);
var imgPath = "./DefectFolder/coarseBIMimg/";
var semantPath = "./DefectFolder/semanticRawStr/";
//var siftPixelCoorList = ext_excel("./kpPixelCoor.xlsx", 1);
//var siftPixelCoorListNmColumn = siftPixelCoorList.map(function(value,index) { return value[0]; });
var totalRows = imgParaList.length;
console.log(totalRows);
var imgID;
// Initialize correspondences data array
//var correspondencesArray = [["imgID","pixelX","pixelY","worldX","worldY","worldZ"]];

//创建HTTP服务器
var server=http.createServer(function(req,res){
    //if(req.url!=="/favicon.ico"){	
    if(req.method === "GET"){
		var body=req.url;
		var queryStr=url.parse(body).query;
		var queryObj=querystring.parse(queryStr);
	
        // Retrieve data from excel file
        if (queryObj.reID==0){                                                
            //var imgID;                  
            if (curRow <= totalRows-1){
                imgID = imgParaList[curRow][0];
                var posX = imgParaList[curRow][1];
				var posY = imgParaList[curRow][2];
				var posZ = imgParaList[curRow][3];
                var pitch = imgParaList[curRow][4];
				var yaw = imgParaList[curRow][5];				
				var focal = imgParaList[curRow][6];    
                var pixelX = 0;				
				var pixelY = 0; 
                var myRes = {imgID: imgID, posX: posX, posY: posY, posZ: posZ, pitch: pitch, yaw: yaw, focal: focal, pixelX: pixelX, pixelY: pixelY};
                myRes = JSON.stringify(myRes);
                curRow = curRow + 1;
                res.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"http://"+ip+":8080"});//注意需带上"Access-Control-Allow-Origin":"http://localhost:8080"，以解决跨域请求问题 
			    res.write(myRes);//注意write方法只能传送文本格式；
                res.end();
            }else{                    
                res.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"http://"+ip+":8080"});//注意需带上"Access-Control-Allow-Origin":"http://localhost:8080"，以解决跨域请求问题 
			    res.write("finished");//注意write方法只能传送文本格式；
                res.end();
            }                                             
        }

        // Retrieve defect point cloud data from excel file
        if (queryObj.reID==2){   
            var defectPCarr = defectPCList;            
            var myRes = {defectPCarr: defectPCarr};
            myRes = JSON.stringify(myRes);                
            res.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"http://"+ip+":8080"});//注意需带上"Access-Control-Allow-Origin":"http://localhost:8080"，以解决跨域请求问题 
			res.write(myRes);//注意write方法只能传送文本格式；
            res.end();                                                       
        }
	}

    else if (req.method === "POST")
	{
        var body=req.url;
		var queryStr=url.parse(body).query;
		var queryObj=querystring.parse(queryStr);
	
        // Receive semantic data
        if (queryObj.reID==1){   
            var img_id = queryObj.imgID;
            console.log("semantic request received!!");
		    var data = "";
		    req.on("data", function(chunk){
			    data += chunk;
		    });
		    req.on("end", function(){
			    data = decodeURI(data);
                //console.log(data);
                fs.writeFile(semantPath+img_id+'.txt', data, function (err) {
                    if (err) return console.log(err);                    
                    res.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"http://"+ip+":8080"});//注意需带上"Access-Control-Allow-Origin":"http://localhost:8080"，以解决跨域请求问题 
			        res.write("SemanticSuccess");//注意write方法只能传送文本格式；
                    res.end();
                });                
            })
        }
        // Receive BIM screenshots
        else{
            console.log("request received!!");
		    var data = "";
		    req.on("data", function(chunk){
			    data += chunk;
		    });
		    req.on("end", function(){
			    data = decodeURI(data);
			    //console.log(data);
			    /*var dataObject = querystring.parse(data);
			    console.log(dataObject);*/

			    //------decode base64 to image and save file--------
			    img = new Buffer(data,"base64");
            					
			    fs.writeFile(imgPath+"cor_bdBIM_"+imgID+".JPG",img,function (err){
				    if (err)
				    {
					    console.log(err);
				    }else{
                        res.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"http://"+ip+":8080"});//注意需带上"Access-Control-Allow-Origin":"http://localhost:8080"，以解决跨域请求问题 
			            res.write("IMGsuccess");//注意write方法只能传送文本格式；
                        res.end();
                    }
			    });            
		    })	
        }
			
	}
        
    
});

server.listen(1337,ip,function(){

    console.log("开始监听...");

});  

// function that extracts info. from excel —— 1 represents sheet#1 and 2 represents sheet#2
function ext_excel (excelPath, sheetNum){
    var sheet = xlsx.parse(excelPath)[sheetNum-1];
    var info = sheet.data;
    return info;
}