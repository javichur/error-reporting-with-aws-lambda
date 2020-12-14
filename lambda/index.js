// 1. Enable/disable channels
const isSNSEnabled = true;
const isTelegramEnabled = true;
const isSlackEnabled = true;

// 2. Config channels
// SNS params
const ARN_TOPIC_SNS = '<your sns arn>';
const SUBJECT = 'ERROR DETECTED';

// Telegram params
const TELEGRAM_ACCESS_TOKEN = '<access token for your telegram bot>'; // used for API https://api.telegram.org/bot<token>/
const TELEGRAM_ID_CHAT = '<your id group chat>'; // Use this API yo get this ID chat: GET https://api.telegram.org/bot<token>/getUpdates

// Slack params
// This url is similar to https://hooks.slack.com/services/T00000000/B00000000/XXXX
const SLACK_WEBHOOK_URL = '<your slack webhook url>';

const zlib = require('zlib');
const AWS = require('aws-sdk');
const Https = require('https');
const Url = require('url');

exports.handler = async (event) => {
  let count = 0;

  if (event.awslogs && event.awslogs.data) {
    const payload = Buffer.from(event.awslogs.data, 'base64');

    // we have to decode (https://docs.aws.amazon.com/lambda/latest/dg/services-cloudwatchlogs.html)
    const unzipped = JSON.parse(zlib.unzipSync(payload).toString());
    // console.log('unzipped=' + JSON.stringify(unzipped));

    const logevents = unzipped.logEvents;

    for (const logevent of logevents) {
      const eventText = `This is the log event body:\n\n${JSON.stringify(logevent, null, 4)}`; // includes pretty spaces (4).

      if (isSNSEnabled) {
        await sendSNS(eventText);
      }
      if (isTelegramEnabled) {
        await sendTelegram(eventText);
      }
      if (isSlackEnabled) {
        await sendSlack(eventText);
      }

      count += 1;
    }
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(`${count} notifications processed.`),
  };
  return response;
};

async function sendSNS(eventText) {
  var sns = new AWS.SNS();
  var params = {
    Message: eventText,
    Subject: SUBJECT,
    TopicArn: ARN_TOPIC_SNS,
  };
  await sns.publish(params).promise();
}

async function sendTelegram(eventText) {
  const urlTelegram = `https://api.telegram.org/bot${TELEGRAM_ACCESS_TOKEN}/sendMessage?chat_id=${TELEGRAM_ID_CHAT}&text=${eventText}`;
  return httpsGeneric(urlTelegram, 'GET', null, null).then((ret) => {
    return ret;
  }).catch(() => {
    return null;
  });
}

// Doc: https://api.slack.com/messaging/webhooks
async function sendSlack(eventText) {
  const body = {
    text: eventText,
  };

  const data = JSON.stringify(body);

  const headers = {
    'Content-Type': 'application/json',
  };

  return httpsGeneric(SLACK_WEBHOOK_URL, 'POST', headers, data).then((ret) => {
    return ret;
  }).catch(() => {
    return null;
  });
}

function httpsGeneric(urlApi, method, headers, data) {
  const parsedUrl = Url.parse(urlApi);

  return new Promise(((resolve, reject) => {
    const options = {
      host: parsedUrl.hostname,
      path: parsedUrl.path,
      method,
    };

    if (headers) {
      options.headers = headers;
    }

    if (method === 'POST') {
      if (!options.headers) options.headers = {};
      options.headers['Content-Length'] = data.length;
    }

    const request = Https.request(options, (response) => {
      let returnData = '';

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        resolve(returnData);
      });

      response.on('error', (error) => {
        console.log(`error httpsGeneric: ${error}`);
        reject(error);
      });
    });

    if (data) {
      request.write(data);
    }

    request.end();
  }));
}
