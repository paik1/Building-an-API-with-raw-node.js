/*
*
* These are the request handlers
*
*/

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Define the handlers
var handlers = {};

// Users
handlers.users = function(data,callback){
    var acceptableMethods = ['post','get','put','delete'];
    if (acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data,callback);
    }else{
        callback(405);
    }
}; 

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback){
    // Check that all required fields are filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.firstName.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement){
        // Make sure the user doesn't already exist
        _data.read('users',phone,function(err,data){
            if(err){
                // Hash the password
                var hashedPassword = helpers.hash(password)

                // Create the user object
                if (hashedPassword){
                    var userObject = {
                        'firstName' : firstName,
                        'lastName'  : lastName,
                        'phone' : phone,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true
                    };
    
                    // Store the user
                    _data.create('users',phone, userObject, function(err){
                        if(!err){
                            callback(200)
                        }else{
                            callback(500,{'Error' : 'Could not create the new user'})
                        }
                    })

                }else{
                    callback(500,{'Error' : 'Could not hash the user\'s password'})
                }
                               
            }else{

                // User already exists
                callback(400, {'Error' : 'A user with that name already exists'});
            }
        });
    }else{
        callback(400,{'Error' : 'Missing required fields'});
    }
};

// Users - get
// Required data : phone
// Optional data : none
// @TODO only let the authenticated user access their object. Don't let them access anyone else's
handlers._users.get = function(data, callback){
    // Check that the phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        // Lookup for the user
        _data.read('users',phone,function(err,data){
            if(!err && data){
                // Remove the hashed password from the user object before returning it to the requester
                delete data.hashedPassword;
                callback(200,data);
            }else{
                callback(404);
            }
        })
    }else{
        callback(400,{ 'Error' : 'Missing required field'});
    }
};

// Users - put
// Required data : phone
// Optional data : firstName, lastName, password (at least one must be specified)
// Only let an authenticated user update their own object. Don't let them update anyone else's

handlers._users.put = function(data, callback){
    // Check for the required field
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    
    // Check for the optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.firstName.trim() : false;

    // Error if the phone is invalid
    if(phone){

    }else
    {
        
    }
};

// Users - delete
handlers._users.delete = function(data, callback){

};



// Ping handler
handlers.ping = function(data,callback){
    callback(200);
};


//Not found handler
handlers.notFound = function(data,callback){
    callback(404);
};

// Export the module
module.exports = handlers;