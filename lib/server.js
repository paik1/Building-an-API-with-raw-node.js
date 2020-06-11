/*
* These are sever related tasks
*/

//Dependencies

var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var _data = require('./data');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');

// Instantiate the server module object
var server = {};

//The server should respond to all requests with a string


// // TESTING
// // @TODO delete this
// _data.delete('test','newFile', function(err){
//     console.log('this was the error ',err);
// });

// TESTING
// @TODO delete this
// helpers.sendTwilioSms('8095660117','Hello!!', function(err){
//     console.log('this was the error ',err);
// });

// Instantiate the HTTP server
server.httpServer = http.createServer(function(req,res){
    server.unifiedServer(req,res);
});

// Instantiate the HTTPS server
server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions,function(req,res){
    server.unifiedServer(req,res);
});





// All the server logic for both the http and https server
server.unifiedServer = function(req,res){

    //Get the url and parse it
    var parsedUrl = url.parse(req.url,true);

    //Get the path
    //If the user requests for localhost:3000/foo then path is the foo part
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'')

    //Get the query string as an object
    //parsedUrl.query object comes back because we had set a parameter as true when getting the parsedUrl which internally calls the query module
    var queryStringObject = parsedUrl.query;

    //Get the HTTP method
    var method = req.method.toLowerCase();

    //Get the headers as an object
    var headers =req.headers;

    //Get the payload if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data',function(data){
        buffer += decoder.write(data);
    });


    //moved the sending response and logging the request path commenst and code inside req.end as req.end is always called beacuse a request might not have a payload
    req.on('end',function(){
        buffer += decoder.end();

        //Choose the handler this request should go to. If one is not found, choose the not found handler
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // construct the data object to send to the handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handler specified in the router
        chosenHandler(data,function(statusCode,payload){
            // Use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            
            // Use the payload called back by the handler, or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};

            //convert the payload to string
            var payloadString = JSON.stringify(payload);

            //return the response
            // To know that the response we are sending is a json object
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // LOgging the request
            console.log('Returning the respone: ',statusCode,payloadString);

        });
    
    });
    
};

//Definig a request router
server.router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'checks' : handlers.checks
};

// Init script
server.init = function(){
    // Start the HTTP server
    server.httpServer.listen(config.httpPort, function(){
    console.log('The server is listening on port '+config.httpPort);
    });

    // Start the HTTPS server
    server.httpsServer.listen(config.httpsPort, function(){
    console.log('The server is listening on port '+config.httpsPort);
    });

};

// Export the module
module.exports = server;