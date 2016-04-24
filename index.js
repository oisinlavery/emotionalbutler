var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var rx = require('rx')
var giphy = require('giphy-api')()

var token = "EAAHFrm1kIZAABAPYZBPDLi32BizaAoMaXMLWUFX0DK2yZC1wnG6Ax5SWHjTzD2nsNb3GCKtQN4bGLqEJud6kzCFxTXJZBXYzBMFEc8SSavHI1hvh4JHptHAJxZBgLvi6NItZCrJIIUVZB4llQhvKli5QYqFd875nkILDiFddjKmrwZDZD"

var app = express()


app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function(req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === 'I_am_your_password_peeXqcJcPV48dZ') {
        res.send(req.query['hub.challenge'])
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

            sendGifs(text)
        }
        if (event.postback) {
            text = JSON.stringify(event.postback)
            sendTextMessage(sender, "Postback received: " + text.substring(0, 200), token)
            continue
        }
    }
    res.sendStatus(200)
})

app.get('/emotion/:emotion', function(req, res) {
    res.send("req:", req.params)
    sendGifs(req.params.emotion)
})



function dealWithMessage() {

}

function getGifData(emotion) {

}

function sendGifs(emotion) {
    giphy.search(emotion).then(function(res) {

        var elements = []

        for (var i = 0; i < 5; i++) {
            
            var result = res.data[i]
            elements.push({
                "title": "title:"+ result.source_tld,
                "image_url": result.images.original.url
            })
        }

        var messageObject = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": elements
                }
            }
        }

        postMessage(messageObject)
    });
}

function postMessage(messageObject) {

    console.log("sendMessage: ", messageData)

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})
