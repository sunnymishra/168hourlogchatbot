const schedule = require('node-schedule');
const util = require('./util');
// const requestPromise = require('request-promise')

let users = [{"fbid":"123456"}, {"fbid":"5678910"}];

exports.invite = function() {
	console.log('********Inside JOB invite callback********');
	users.forEach((user) => {
		let event={};
		event.sender.id=user.fbid;
  		event.message.text='chutzpah_invitation_jimmyhenrix';
		sendMessage(event);
	});
}

exports.scheduleJob = function() {
  console.log('******Inside schedule()******');
  let startTimeInit=new Date();
  // let startTime = util.getNextHour(startTimeInit);
  let startTime = util.addMintsToDate(startTimeInit,1);
  console.log('***Next schedule startTime='+startTime)

  var j = schedule.scheduleJob({start: startTime, rule: '*/1 * * * *'}, function(){
    invite();
  });
  return j;
}

/*(function scheduler() {
   pollninvite()
      .then(function() {
        console.log('******Inside schedule()******');
        // pollninvite();
        setTimeout(function() {
            console.log('Going to restart');
            scheduler();
        }, 1000 * 60 * 0.3);
    }).catch(err => console.error('error in scheduler()', err));
})();*/