// require relevant modules
var http=require("http");
var url=require("url");
var querystring=require("querystring");
var path = require("path");
var fs = require("fs");
var xlsx = require("node-xlsx");
var exec = require('child_process').exec;  // import command line execution module, so as to triger python file in node.js

// Configure server IP
var ip = "147.8.133.35";

//define variable to contain class cofig_info and historical annotation results;
var curRow = 1;
var imgParaList = ext_excel("./imgCaptureParam.xlsx", 1);
var siftPixelCoorList = ext_excel("./kpPixelCoor.xlsx", 1);
var siftPixelCoorListNmColumn = siftPixelCoorList.map(function(value,index) { return value[0]; });
var totalRows = imgParaList.length;
// Initialize correspondences data array
var correspondencesArray = [["imgID","pixelX","pixelY","worldX","worldY","worldZ"]];

//创建HTTP服务器
var server=http.createServer(function(req,res){
    if(req.url!=="/favicon.ico"){	    		
		var body=req.url;
		var queryStr=url.parse(body).query;
		var queryObj=querystring.parse(queryStr);
	
        // Retrieve data from excel file
        if (queryObj.reID==0){                      
            if (curRow <= totalRows-1){                   
                var imgID;  
                var indexInSIFTlist;
                for (i = 1; i < 1000; i++){
                    imgID = imgParaList[curRow][0];
                    var imgIDArray = imgID.split("_");
                    if (imgIDArray[4]){
                        var imgIDReal =  imgIDArray[imgIDArray.length-3]+"_"+imgIDArray[imgIDArray.length-2]+"_"+imgIDArray[imgIDArray.length-1];
                    }else{
                        var imgIDReal = imgID;
                    }
                    indexInSIFTlist = siftPixelCoorListNmColumn.findIndex(function(value){return value == imgIDReal});
                    if (indexInSIFTlist != -1){
                        break;
                    }else{
                        curRow = curRow + 1;
                        if (curRow >= totalRows){
                            break;
                        }
                    }
                }
                if (curRow <= totalRows-1){
                    imgID = imgParaList[curRow][0];
                    var posX = imgParaList[curRow][1];
				    var posY = imgParaList[curRow][2];
				    var posZ = imgParaList[curRow][3];
                    var pitch = imgParaList[curRow][4];
				    var yaw = imgParaList[curRow][5];				
				    var focal = imgParaList[curRow][6];
                    var pixelX = siftPixelCoorList[indexInSIFTlist][1];
                    var pixelY = siftPixelCoorList[indexInSIFTlist][2];
                    siftPixelCoorListNmColumn[indexInSIFTlist] = "Replaced";                                              
                    var myRes = {imgID: imgID, posX: posX, posY: posY, posZ: posZ, pitch: pitch, yaw: yaw, focal: focal, pixelX: pixelX, pixelY: pixelY};
                    myRes = JSON.stringify(myRes);
                    res.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"http://"+ip+":8080"});//注意需带上"Access-Control-Allow-Origin":"http://localhost:8080"，以解决跨域请求问题 
			        res.write(myRes);//注意write方法只能传送文本格式；
                    res.end();
                }else{
                    var buffer = xlsx.build([
                        {
                            name:'sheet1',
                            data:correspondencesArray   
                        }                        
                    ]);
                    fs.writeFileSync('./2D_3D_Correspondences.xlsx',buffer,{'flag':'w'});   //生成excel
                    res.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"http://"+ip+":8080"});//注意需带上"Access-Control-Allow-Origin":"http://localhost:8080"，以解决跨域请求问题 
			        res.write("finished");//注意write方法只能传送文本格式；
                    res.end();
                }             
            }else{
                var buffer = xlsx.build([
                        {
                            name:'sheet1',
                            data:correspondencesArray   
                        }                        
                    ]);
                fs.writeFileSync('./2D_3D_Correspondences.xlsx',buffer,{'flag':'w'});   //生成excel
                res.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"http://"+ip+":8080"});//注意需带上"Access-Control-Allow-Origin":"http://localhost:8080"，以解决跨域请求问题 
			    res.write("finished");//注意write方法只能传送文本格式；
                res.end();
            }                      
        }

        // Save 2D-3D correspondences coordinates to excel
        if (queryObj.reID==1){            
            var imgID = queryObj.imgID;
            var pixelX = queryObj.pixelX;
            var pixelY = queryObj.pixelY;
            var worldX = queryObj.worldX;
            var worldY = queryObj.worldY;
            var worldZ = queryObj.worldZ;        
            correspondencesArray.push([imgID, pixelX, pixelY, worldX, worldY, worldZ]); 
            console.log("imgID:"+imgID);
            console.log("worldX:"+worldX);
            console.log("worldY:"+worldY);
            console.log("worldZ:"+worldZ);
            res.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"http://"+ip+":8080"});//注意需带上"Access-Control-Allow-Origin":"http://localhost:8080"，以解决跨域请求问题 
			res.write("Data received");//注意write方法只能传送文本格式；
            res.end();
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