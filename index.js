var app=require('express')();
var express = require('express');
var http=require('http').Server(app);
var io=require('socket.io')(http);
app.get('/', function(req,res){
	res.sendFile(__dirname +'/index.html');
});
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = 'mongodb://admin:admin@ds061676.mlab.com:61676/envirocar';

// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connection test successful");
  db.close();
});//mongoclient conn closed
//client connect with app
io.on('connection',function(socket){
	console.log('a user connected');

socket.on('disconnect',function(){
	console.log('user disconnected');
});//socket disconnect

MongoClient.connect(url, function(err, db) {
  var tracks = db.collection('tracks');
  if(err) throw err;
  assert.equal(null, err);
  console.log("Connected successfully to server for total");
  var count=0; 
  tracks.count().then(function(count){
	io.sockets.emit('total',count);
  console.log(count);
  });//ending of count
  db.close();
});//ending of mongoclient for initial count

//Action for Outliers query
socket.on('outliers query',function(data){
	var max=parseFloat(data.max);//max value received from client
	var min=parseFloat(data.min);//min value received from client
  max=max+(max*0.4);//for 40% range
  min=min-(min*0.4);
 MongoClient.connect(url, function(err, db) {
   var tracks = db.collection('tracks');
   if(err) throw err;
   assert.equal(null, err);
   console.log("Connected successfully to server for outliers query");
   var count=0;
   var q1={};//creating JSON for query
   q1['length']={};
   q1.length['$gt']=max;
   var q2={};
   q2['length']={};
   var q=[];
   q[0]=q1;
   q[1]=q2;
   tracks.find({$or:q},{length:1,name:1,description:1}).limit(100).sort({length:1}).toArray(function(err,docs){
     if(err) throw err;
     docs.forEach(function (docs) {
        io.sockets.emit('outliers',{length:docs.length , name:docs.name, description:docs.description});
      });//end of loop
     db.close();
    });//ending of tracks.find 100 samples
  });//ending of mongoclient
MongoClient.connect(url, function(err, db) {
   var tracks = db.collection('tracks');
   if(err) throw err;
   assert.equal(null, err);
   console.log("Connected successfully to server for outliers query");
   var count=0;
   //creating JSON for query
   var q1={};q1['length']={};q1.length['$gt']=max;var q2={};q2['length']={};var q=[];q[0]=q1;q[1]=q2;
   tracks.find({$or:q},{length:1,name:1,description:1}).count().then(function(err,count){
      if (err) throw err;
      io.sockets.emit('outliers count',count);
      db.close();
    });//ending of outliers count
   });//ending of mongoclient
});//ending of socket.on



//Action for deleting Outliers query
socket.on("outliers delete",function(data){
	 var max=parseFloat(data.max);
	 var min=parseFloat(data.min);
   max=max+(max*0.4);
   min=min-(min*0.4);
 MongoClient.connect(url, function(err, db) {
   var tracks = db.collection('tracks');
   if(err) throw err;
   assert.equal(null, err);
   console.log("Connected successfully to server for outliers deletion");
   var count=0;
   var q1={};
   q1['length']={};
   q1.length['$gt']=max;
   var q2={};
   q2['length']={};
   q2.length['$lt']=min;
   var q=[];
   q[0]=q1;
   q[1]=q2;
   tracks.deleteMany({$or:q},{length:1,name:1,description:1}).then(function(err,docs){
     if(err) throw err;
     io.sockets.emit('delete',docs);
    });//ending of tracks.deletemany
 });//ending of mongoclient
 MongoClient.connect(url, function(err, db) {
   var tracks = db.collection('tracks');
   if(err) throw err;
   assert.equal(null, err);
   tracks.count().then(function(err,count){
   if(err) throw err;
   io.sockets.emit('remaining',count);
  });//ending of remaining count
 });//ending of mongoclient
});//ending of socket.on
});//ending of io.on
http.listen(3000, function(){
	console.log('and here we are, *:3000');
});