const core = require('@actions/core'),
	token=core.getInput('token'),
	github = require('@actions/github'),
	context = github.context,
	eventName = context.eventName,
	payload = context.payload,
	action=payload.action,
	octokit = github.getOctokit(token),
	repository = process.env.GITHUB_REPOSITORY,
	repository_owner = repository.split('/')[0],
	repository_name = repository.split('/')[1]
;

try {
	if ('pull_request' === eventName) {
		if ('labeled' === action) {
			requestReviews();
		}
	}

	if ('pull_request_review' === eventName) {

	}
} catch (error) {
  core.setFailed(error.message);
}

/**
 * Requests reviewers on the pull request
 */
async function requestReviews() {
	let { data: currentReviewers } = await octokit.pulls.listRequestedReviewers({
	  owner: repository_owner,
	  repo: repository_name,
	  pull_number: payload.number,
	}),
	    requestedReviewers = []
	;

	// keep reviewers if they were already assigned
	currentReviewers.forEach(function(reviewer) {
		requestReviewers.push(reviewer.login);
	});

	// always add the permanent reviewer
	if (!requestedReviewers.includes(core.getInput('permanent_reviewer'))) {
		requestedReviewers.push(core.getInput('permanent_reviewer'));
	}


	// complete the list of reviewers until the expected number of reviewers is reached
	if (requestedReviewers.length < core.getInput('reviewers_number')) {
		// get the whole list of repository collaborators and shffle assign reviewers
		let { data: collaborators } = await octokit.repos.listCollaborators({
		  owner: repository_owner,
		  repo: repository_name
		});

		shuffle(collaborators).forEach(function(collaborator) {
			let login = collaborator.login;

			if (requestedReviewers.length < core.getInput('reviewers_number') && !requestedReviewers.includes(login)) {
				// add reviewer
				requestedReviewers.push(login);
			}
		});
	}

	console.log(requestedReviewers);

	octokit.pulls.requestReviewers({
	  owner: repository_owner,
	  repo: repository_name,
	  pull_number: payload.number,
	  reviewers: requestedReviewers
	});
}

/**
 * Shuffles array in place.
 */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}


// function editLabel() {
//     var context = github.context;
//     var pr = context.payload.pull_request;
//     if (!pr) {
//         return;
//     }
//     if (type == "add") {
//         client.issues.addLabels(__assign(__assign({}, context.repo), { issue_number: pr.number, labels: [label] }))["catch"](function (e) {
//             console.log(e.message);
//         });
//     }
//     if (type == "remove") {
//         client.issues.removeLabel(__assign(__assign({}, context.repo), { issue_number: pr.number, name: label }))["catch"](function (e) {
//             console.log(e.message);
//         });
//     }







// try {

//   	// listen to label addition
//   	if ('labeled' === action) {
//   		getCollaborators();
//   		// case RFR label added
//   		if (core.getInput('label_review') === payload.label.name) {
//   		}
//   			assignReviewers();
//   	}

//   	// listen to submitted review
//   	if ('submitted' === action) {

//   	}

//   // // `who-to-greet` input defined in action metadata file
//   // const nameToGreet = core.getInput('who-to-greet');
//   // console.log(`Hello ${nameToGreet}!`);
//   // const time = (new Date()).toTimeString();
//   // core.setOutput("time", time);
//   // // Get the JSON webhook payload for the event that triggered the workflow
//   // console.log(`The event payload: ${payload}`);
// } catch (error) {
//   core.setFailed(error.message);
// }



// // function editLabel() {
// //     var context = github.context;
// //     var pr = context.payload.pull_request;
// //     if (!pr) {
// //         return;
// //     }
// //     if (type == "add") {
// //         client.issues.addLabels(__assign(__assign({}, context.repo), { issue_number: pr.number, labels: [label] }))["catch"](function (e) {
// //             console.log(e.message);
// //         });
// //     }
// //     if (type == "remove") {
// //         client.issues.removeLabel(__assign(__assign({}, context.repo), { issue_number: pr.number, name: label }))["catch"](function (e) {
// //             console.log(e.message);
// //         });
// //     }
// // }