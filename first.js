const sfdx = require('sfdx-js').Client.createUsingPath('sfdx')

// options - all options to use for the relevant commands
//   (see sfdx config documentation)
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Promise = require('promise');
const path = require('path');


const PORT = process.env.PORT || 3000;
//const INDEX = path.join(__dirname, 'index.html');
const ConfigPath = path.join(__dirname, '/config/project-scratch-def.json');
const serverkey = path.join(__dirname, '/config/server.key');

app.get('/', function(req, res) {
   res.sendfile(__dirname + '/index.html');
});

io.on('connection', function(socket) {  

   console.log('Client connected...');
    
          var PromiseFunction =  new Promise(                     
                       function(resolve, reject)
                        {
                         var list_of_config = sfdx.config.get({
                                json: 'defaultusername'
                              }).then(function(data){
                                 var displaylist = sfdx.org.display({
                                  TARGETUSERNAME : data.result.value
                                }).then(function(configList){
                              //    io.emit('configList',configList);
                                })     
                              })
                        });     

          socket.on('CheckStatus',function(){
            PromiseFunction
              .then(fulfilled => console.log(fulfilled)) // fat arrow
              .catch(error => console.log(error.message)); // fat arrow
          })

      socket.on('OpenThisOrg', function(radioValue){
        sfdx.org.open({
            TARGETUSERNAME : radioValue
          })
          .then(function(OpenDevHubResponse){
            console.log('Opening Org');
            io.emit('OpenDevHubResponse',OpenDevHubResponse);
          });
      })
      
      socket.on('ListAllOrgs', function() {
        var list_of_orgs = sfdx.org.list();
        list_of_orgs
          .then(function(listMyOrgReturn){       
                  //send a message to ALL connected clients
                  console.log('inside list');
                  io.emit('listMyOrgReturn', listMyOrgReturn);
              });
          });

       socket.on('ModelList', function() {
        var list_of_orgs = sfdx.org.list({
          all : true
        });
        list_of_orgs
          .then(function(data){       
                  //send a message to ALL connected clients
                  //console.log(data);
                  io.emit('ListData', data);
              });
          });

      socket.on('OpenDevHub',function(){
          sfdx.org.open({
            targetusername : 'alekh.newdx@cognizant.com'
          }).then(function(OpenDevHubResponse){
            console.log('OpenDevHubResponse');
            io.emit('OpenDevHubResponse',OpenDevHubResponse);
          });
      });

      socket.on('CreateNewOrg',function(){ 
                
              sfdx.org.create({
                  definitionfile: ConfigPath,
                  setalias: 'orgAlias'
                }) 
              .then(function(CreateNewOrgResponse){
                console.log('Created Scratch org');
                io.emit('CreateNewOrgResponse',CreateNewOrgResponse)  
              });
      });
   
      socket.on('AuthMyOrg', function()
      {
          sfdx.auth.jwtGrant({
              clientid : "3MVG9d8..z.hDcPLdOuWz_l8Vx2oqBrVAOQqpwJtIVvKCc8PBvMzyl4OlRqYT01GeAZABU7tQhlBCDbq9p1q.",
              jwtkeyfile : __dirname + '/config/server.key',
              username : "alekh.newdx@cognizant.com",
              setdefaultdevhubusername : "true",
              setalias : "Testing"
          }).then(function() {
           console.log('Auth done!');
          })

      });

      socket.on('SourcePull',function() {
       sfdx.source.pull().then(function(data) {
        console.log(data);
        console.log(' pull done!');
   })

});

});

http.listen(3000, function() {
   console.log('listening on *:3000');
});
