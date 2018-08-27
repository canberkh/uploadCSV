var fs = require('fs');
var csv = require('fast-csv');
const pool = require('./pgdb');
var chokidar = require('chokidar');

const express = require('express');
const multer = require('multer');

const upload = multer({
  dest: 'csv/', // this saves your file into a directory called "csv"
  filename: 'input.csv'
}); 

var watcher = chokidar.watch('./csv', {
  ignored: /[\/\\]\./, persistent: true
});

var log = console.log.bind(console);

const app = express();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// It's very crucial that the file name matches the name attribute in your html
app.post('/', upload.single('file-to-upload'), (req, res) => {
  res.redirect('/');
});

app.listen(3000);

fs.readdir('./csv', function(err, files) {
    if (err) {
    
    } else {
        if (!files.length) {
    console.log("Empty folder")
        }
    else{
    console.log('Upload Complete')
    }
        }
    
});

watcher
  .on('add', function(path) { 
      
    log('File', path, 'has been added'); 

    pool.connect(function(err){
        if(err)
        {
            console.log(err);
        }
    });
    
let counter = 0; 
let tableCounter = 0;
    
    // let header = [];
    // let data = [];
    
let tableName = "table" + tableCounter

pool.query("CREATE TABLE " + tableName + "(\
    policyID  			integer,\
    statecode 			text,\
    county 			text,\
    point_latitude 	double precision,\
    point_longitude 	double precision,\
    line 				text,\
    construction		text\
);", function(err){
    if(err)
    {
        console.log(err);
    }
});



let csvStream = csv.fromPath(path, { headers: true }, )
    .on("data", function(record){
        csvStream.pause();

        if(counter < 100)
        {
            let policyID = record.policyID;
            let statecode = record.statecode;
            let county = record.county;
            let point_latitude = record.point_latitude;
            let point_longitude = record.point_longitude;
            let line = record.line;
            let construction = record.construction;

            pool.query("INSERT INTO " + tableName+ " (policyID, statecode, county, point_latitude, point_longitude, line, construction) \
            VALUES($1, $2, $3, $4, $5, $6, $7)", [policyID, statecode, county, point_latitude, point_longitude, line, construction], function(err){
                if(err)
                {
                    console.log(err);
                }
                
            });
            ++counter;
        }

        csvStream.resume();
        

    }).on("end", function(){
        console.log("Job is done!");
    }).on("error", function(err){
        console.log(err);
    });

    tableCounter++
   
fs.unlink(path, (err) => {
    if (err) throw err;
    console.log(path + ' was deleted');
    });
    console.log(tableCounter)

})
