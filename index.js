const core = require('@actions/core'),
	token=core.getInput('token'),
	github = require('@actions/github'),
	context = github.context,
	payload = context.payload,
	action=payload.action,
	octokit = github.getOctokit(token),
	repository = process.env.GITHUB_REPOSITORY,
	repository_owner = repository.split('/')[0],
	repository_name = repository.split('/')[1]
;

core.debug("context", context);
core.debug("octokit", octokit);

async function getCollaborators() {
	let { data: collaborators } = await octokit.repos.listCollaborators({
	  repository_owner,
	  repository_name
	});

   	console.log(collaborators);
}
getCollaborators();

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