'use strict';
require('dotenv').load();

const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const APIAI_TOKEN = process.env.APIAI_TOKEN;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const FB_WEBHOOK_VERIFICATION_TOKEN = process.env.FB_WEBHOOK_VERIFICATION_TOKEN
const APIAI_SESSION_ID = process.env.APIAI_SESSION_ID

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const apiai = require('apiai');
const apiaiApp = require('apiai')(APIAI_TOKEN);
const app = express();
const invitation = require('./invitation');

//  Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

let globalObj={};

(function init(){
  const job = invitation.scheduleJob();
  globalObj.job=job;
})();

app.post('/invitationjob', (req, res) => {
  console.log('*** RECEIVED JOB start request ***');
  const job = invitation.scheduleJob();
  globalObj.job=job;
  res.status(200).end();
});

app.delete('/invitationjob', (req, res) => {
  console.log('*** RECEIVED JOB stop request ***');
  globalObj.job.cancel();
  res.status(200).end();
});

/* For 1 time Facebook Validation */
app.get('/', (req, res) => {
   console.log('***Reached Get***');
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === FB_WEBHOOK_VERIFICATION_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* For handling all messenges. This is webhook callback POST url*/
app.post('/', (req, res) => {
  console.log('*** RECEIVED MSG ***');
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          sendMessage(event);
        }
      });
    });
    res.status(200).end();
  }else {
    res.status(403).end();
  }
});

function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;
  let options = {
    sessionId: (sender+'||'+APIAI_SESSION_ID)
  };
  askAI(text,options)
    .then(response => {
      console.log('***Api.ai response:***')
      console.log(response)
      console.log('********')
      let aiText = response.result.fulfillment.speech;
     // aiText=!aiText?defaultResp():aiText;
      request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FB_PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
          recipient: {id: sender},
          message: {text: aiText}
        }
      }, (error, response) => {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
      });
    }).catch(error => {
      console.log(error)
    });
}

/* Webhook for API.ai to get response from the 3rd party API */
app.post('/aiwebhook', (req, res) => {
  console.log('*** Webhook for api.ai query ***');
  console.log(req.body.result);

  if (req.body.result.action === 'logThisWork') {
    console.log('*** logThisWork ***');
    let work = req.body.result.parameters['work'];
    console.log('work='+work);
    return res.json({
      speech: work,
      displayText: work,
      source: req.body.result.action
    });
  }
  res.status(200).end();
});

function askAI(text, options) {
  return new Promise((resolve, reject) => {
    // let request = apiaiApp.textRequest(text, Object.assign(defaultOptions, options));
    let request = apiaiApp.textRequest(text, options);
    request.on('response', (response) => {
      return resolve(response);
    });

    request.on('error', (error) => {
      return reject(error);
    });

    request.end();
  })
}

function getAllIntents(options) {
  return new Promise((resolve, reject) => {
    let request = apiaiApp.intentGetRequest(options);

    request.on('response', (response) => {
      return resolve(response);
    });

    request.on('error', (error) => {
      return reject(error);
    });

    request.end();
  })
}
function defaultResp(){
  let defaultResp = ['Sure!','Hmm','I see.','Ok.','I understand.','I don\'t understand that'];
  var resp = defaultResp[Math.floor(Math.random()*defaultResp.length)];
  return resp;
}
