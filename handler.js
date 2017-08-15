const axios = require('axios');

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const sentMessagesURL = 'https://becqd6a376.execute-api.us-east-1.amazonaws.com/dev/sentMessages';
const twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken);

module.exports.sendMessage = (event, context, callback) => {
  // console.log(event);
  sendSMS(event, callback);
};

function sendSMS (event, callback) {
  // convert stuff to json if needed
  let eventData;
  try {
    eventData = JSON.parse(event.body);
  } catch (e) {
    eventData = event.body;
  }
  // set up message
  const sms = {
    to: eventData.to,
    body: eventData.message || '',
    from: twilioPhoneNumber,
  };
  // use twilio SDK to send text message
  twilioClient.messages.create(sms, (error, data) => {
    // error
    if (error) {
      console.log(`TWILIO ERROR: ${error.status} ${error.message}`);
      const errResponse = {
        statusCode: error.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: error.message,
          error: error
        }),
      };
      return callback(null, errResponse);
    }
  
    // text sent
    console.log(`NEW_MESSAGE_SENT ${data.to}`);
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Text sent'
      }),
    };

    // save to sentMessages DB
    axios.post(sentMessagesURL,{
      number: eventData.to,
      message: eventData.message
    }).then((response) => {
      console.log(`NEW_MESSAGE_SAVED_TO_DB ${data.to}`);
      console.log(response);
      // callback(null, response);
    }).catch((error) => {
      console.log(`SAVE_TO_DB_ERROR:`);
      console.log(error);
    });
  });
}
