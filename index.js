const core = require('@actions/core');
try {
	const github = require('@actions/github'),
  		payload = JSON.stringify(github.context.payload, undefined, 2),
  		action=payload.action
  	;

  	// listen to label addition
  	if ('labeled' === action) {
  		// case RFR label added
  		if (core.getInput('label_review') === payload.label.name) {
  			assignReviewers();
  		}
  	}

  	// listen to submitted review
  	if ('submitted' === action) {

  	}


	console.log(core.getInput('token'));
  // // `who-to-greet` input defined in action metadata file
  // const nameToGreet = core.getInput('who-to-greet');
  // console.log(`Hello ${nameToGreet}!`);
  // const time = (new Date()).toTimeString();
  // core.setOutput("time", time);
  // // Get the JSON webhook payload for the event that triggered the workflow
  // console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}

function assignRevewers() {


}