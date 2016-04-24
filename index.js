var facebookToken = 'EAAHFrm1kIZAABAPYZBPDLi32BizaAoMaXMLWUFX0DK2yZC1wnG6Ax5SWHjTzD2nsNb3GCKtQN4bGLqEJud6kzCFxTXJZBXYzBMFEc8SSavHI1hvh4JHptHAJxZBgLvi6NItZCrJIIUVZB4llQhvKli5QYqFd875nkILDiFddjKmrwZDZD'
var giphyToken = ''
var apiaiClientAccessToken = 'd99406dc5e8e444483f85563254f2010'
var apiaiDeveloperAccessToken = 'a0ea0ab4d9b34975a3572ecaa350474c'

var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var events = require('events')
var q = require('q')

var giphy = require('giphy-api')()
var apiai = require('apiai')(apiaiClientAccessToken, '')


var app = express()

var eventEmitter = new events.EventEmitter();





app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function(req, res) {
    res.status(200).send('Hello world, I am a chat botski!'.toString())
})

// for Facebook verification
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === 'I_am_your_password_peeXqcJcPV48dZ') {
        res.status(200).send(req.query['hub.challenge'].toString())
    }
    res.send('Error, wrong token')
})

app.post('/webhook/', function(req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id

        if (event.message && event.message.text) {
            text = event.message.text

            understandMessage(text)
            .then(searchGiphy)
            .then(function(results) {
                postReply(createReply(results))
            })
        }
    }
    res.sendStatus(200)
})

app.get('/message/:message', function(req, res) {

    understandMessage(req.params.message)
    .then(searchGiphy)
    .then(function(results) {
        res.status(200).send("reply: "+ JSON.stringify(createReply(results)))
    })
})

function understandMessage(message) {
    var deferred = q.defer()

    var request = apiai.textRequest(message)

    request.on('response', function(response) {
        console.log(response.result.parameters.emotion)
        deferred.resolve(response.result.parameters.emotion);
    });
     
    request.on('error', function(error) {
        deferred.reject(new Error(error));
    });
     
    request.end()

    return deferred.promise
}

function searchGiphy(query){
    var deferred = q.defer()

    giphy.search(query, function(error, result) {

        if(error){
            deferred.reject(new Error(error));
        }
        else{
            deferred.resolve(result.data)
        }
    }) 

    return deferred.promise
}

function createReply(results) {

    var elements = []

    for (var i = 0; i < 5; i++) {
        
        var result = results[i]
        elements.push({
            "image_url": result.images.original.url
        })
    }

    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": elements
            }
        }
    }
}

function postReply(reply) {

    var deferred = q.defer()
    console.log("postMessage: ", JSON.stringify(reply))

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: facebookToken },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: reply,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending reply: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})
