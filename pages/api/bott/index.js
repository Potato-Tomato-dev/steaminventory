import SteamUser from 'steam-user';
import SteamTotp from 'steam-totp';
import SteamCommunity from 'steamcommunity';
import TradeOfferManager from 'steam-tradeoffer-manager';

tradeBot1 = Meteor.settings.SteamTradeBot1;

// Vars
const client = new SteamUser();

const community = new SteamCommunity();

const manager = new TradeOfferManager({
	steam: client,
	community: community,
	language: 'en'
});

const logOnOptionsBot1 = {
	accountName: tradeBot1.username,
	password: tradeBot1.password,
	twoFactorCode: SteamTotp.generateAuthCode(tradeBot1.sharedSecret)
};

// Bot login
client.logOn(logOnOptionsBot1);

// After login set bot as online
client.on('loggedOn', Meteor.bindEnvironment(function(){
	console.log('Steam Trade Bot #1 online.');
	client.setPersona(SteamUser.Steam.EPersonaState.Online);
}));

// Set cookies
client.on('webSession', Meteor.bindEnvironment(function(sessionid, cookies){
	manager.setCookies(cookies);
	community.setCookies(cookies);
}));


Meteor.methods({
	sendTradeOffer(tradeUrl, winId, uid) {
        const offerSend = Meteor.wrapAsync(offer.send, offer);
        const communityAcceptConfirmationForObject = Meteor.wrapAsync(community.acceptConfirmationForObject, community);
        try {
          const assetId = '1111111111';
          const appid = '730';
          const itemName = 'itemnamexxxxxxx';
    
          // Create new offer
          // https://github.com/DoctorMcKay/node-steam-tradeoffer-manager/wiki/TradeOfferManager
          const offer = manager.createOffer(tradeUrl);
    
          // Add item to offer
          offer.addMyItem({
            assetId,
            appid,
            contextid: 2,
            amount: 1
          });
    
          // Set custom message
          offer.setMessage(`Congrats! You got ${itemName}! Ref: ${winId}`);
    
          // Send offer
          const status = offerSend(); // will throw error on failure
          console.log(`Sent offer. Status: ${status}. Waiting for auto confirmation ...`);
    
          // Set a 5 second delay before confirmation
          Meteor._sleepForMs(5000); // Fiber based inline sleep
          communityAcceptConfirmationForObject(tradeBot1.indentitySecret, offer.id);  // will throw error on failure
    
          console.log('Offer confirmed.');
          console.log('Sent Steam item with ID: ', assetId);
    
          // Update data in mongo
          // .....
    
          // Return something to the front ???
          const outcome = {
            message: 'Trade offer sent!'
          }
    
          return outcome;
    
        } catch (err) {
          throw new Meteor.Error('oops', err.message); // return error to client
        }
      },
});