/*
* These are worker related tasks
*/

// Dependencies
var path = require('path');
var fs = require('fs');
var _data = require('./data');
var https = require('https');
var http = require('http');
var helpers = require('./helpers');
var url = require('url');

// Instantiate the worker object
var workers = {};

// Lookup all the checks, get their data, send to a validator
workers.gatherAllChecks = function(){
    // get all the checks
    _data.list('checks', function(err,checks){
        if(!err && checks && checks.length > 0){
            checks.forEach(function(checks){
                // Read in the check data
                _data.read('checks',check,function(err,originalCheckData){
                    if(!err && originalCheckData){
                        // Pass it to the check validator, and let that function continue or log errors
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log("Error reading one of the check's data");
                    }
                });
            });
        }else{
            console.log("Error: Could not find any checks to process");
        }
    })
}

// Sanity-check the check-data
workers.validateCheckData = function(originalCheckData){
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
    originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['https', 'http'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
    originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes.length > 0 && originalCheckData.successCodes instanceof Array ? originalCheckData.successCodes : false;
    originalCheckData.timeOutSeconds = typeof(originalCheckData.timeOutSeconds) == 'number' && originalCheckData.timeOutSeconds.length >= 1 && originalCheckData.timeOutSeconds.length <= 5 && originalCheckData.timeOutSeconds % 1 === 0 ? originalCheckData.timeOutSeconds : false;

    // Set the keys that may not be set ( if the workers have never seen this check before)
    originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked.length > 0 ? originalCheckData.lastChecked : false;

    // If all the checks pass, pass the data along to the next step in the process
    if(originalCheckData.id &&
     originalCheckData.userPhone &&
     originalCheckData.protocol &&
     originalCheckData.url &&
     originalCheckData.method &&
     originalCheckData.successCodes &&
     originalCheckData.timeOutSeconds)
    {
        workers.performCheck(originalCheckData);
    }else{
        console.log('Error: One of the checks is not properly formatted. Skipping it')
    }
};

// Perform the check. Send the originalCheckData and the outcome of the check process, to the next step in the process
workers.performCheck = function(originalCheckData){
    // Prepare the initial check outcome
    var checkOutcome = {
        'error' : false,
        'responseCode' : false
    };

    // Mark that the outcome has not been sent yet
    var outcomeSent = false;

    // Parse the hostname and the path out of the original  check data
    var parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url,true);
    var hostName =  parsedUrl.hostname;
    var path = parsedUrl.path; // Using path and not "pathname" because we want the query string

    // Construct the request

    var requestDetails = {
        'protocol' : originalCheckData.protocol+':',
        'hostname' : hostName,
        'method' : originalCheckData.method.toUpperCase(),
        'path' : path,
        'timeout' : originalCheckData.timeOutSeconds * 1000
    }

    // Instantiate the request object (using either the http or https module)
    var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
    
};


// Timer to execte the worker process once per minute
workers.loop = function(){
    setInterval(function(){
        workers.gatherAllChecks();
    },1000*60)
}

// Init script
workers.init = function(){
    // Execute all the checks immediately
    workers.gatherAllChecks();
    // Call the loop so the checks will execute later on 
    workers.loop();
}


// Export the module
module.exports = workers;