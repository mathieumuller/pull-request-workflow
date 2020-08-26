/**
 * PULL REQUEST WORKFLOW ACTION
 *
 * 1. The developer is done, he adds the status RFT to its pull request -> the pull request is locked (mergeable false) -> acceptance tests are triggered
 * 2. a. Tests fails -> add label FFF -> assign author , the developer fixes its PR and add the label RFT when he's done
 *    b. Tests success -> add label RFR -> unassign author + request and assign reviewers (permanent + 2 randoms)
 * 3. a. Review changes_requested -> unassign reviewer -> remove label RFR -> add label FFF -> developer fixes its PR and add the label RFT to reenter tests process after his fixes
 *    b. Review comments -> assign author -> nothing happens the developer answer the comment and the reviewer decides if he approves or refuse the PR
 *    c. Review approved -> unassign reviewer
 *    					 -> if 2 approvals and label is RFR -> remove label RFR -> add label RTM -> unassign author -> assign mergeator -> unlock PR
 */

const core = require('@actions/core'),
	token = core.getInput('token'),
	github = require('@actions/github'),
	context = github.context,
	octokit = github.getOctokit(token),
	eventName = context.eventName,
	payload = context.payload,
	action = payload.action,
	repository = process.env.GITHUB_REPOSITORY,
	repository_owner = repository.split('/')[0],
	repository_name = repository.split('/')[1],
	pullRequest = payload.pull_request,
	author = pullRequest.user.login,
	pullNumber = pullRequest.number,
	labelTest = core.getInput('label_test'),
	labelReview = core.getInput('label_review'),
	labelChangesRequested = core.getInput('label_changes_requested'),
	labelApproved = core.getInput('label_approved'),
	permanentReviewer = core.getInput('permanent_reviewer'),
	mergeator = core.getInput('mergeator'),
	reviewersNumber = core.getInput('reviewers_number'),
	approvalsNumber = core.getInput('approvals_number')
;

try {
	if ('pull_request' === eventName) {
		if ('labeled' === action) {
			let label = payload.label;

			// add RFT label -> lock the PR (mergeable = false) and trigger acceptance tests,
			if (label.name === labelTest) {
				// TO DO
			}

			// add RFR label -> request and assign reviewers,
			if (label.name === labelReview) {
				requestReviews();
			}

			// add FFF label -> assign author,
			if (label.name === labelChangesRequested) {
				addAssignees([author]);
			}

			// add RTM label -> unassign author + assigne mergeator
			if (label.name === labelChangesRequested) {
				removeAssignees([author]);
				addAssignees([mergeator]);
			}
		}
	}

	if ('pull_request_review' === eventName) {
		let review = payload.review
			reviewer = review.user.login
		;

		if ('submitted' === action) {
			// on changes requested -> remove RFR -> add FFF -> unassign reviewer
			if ('changes_requested' === review.state) {
				removeLabel(labelReview);
				addLabels([labelChangesRequested]);
				removeAssignees([reviewer]);
				addAssignees([author]);
			}

			// on comment -> assign author
			if ('commented' === review.state) {
				addAssignees([author]);
			}

			// on approve -> unassign reviewer
			if ('approved' === review.state) {
				removeAssignees([reviewer]);
				// check number of approvals
				if (isApproved()) {
					// remove RFR and FFF and add RTM labels
					addLabels([labelApproved]);
					removeLabel(labelReview);

					// unassign reviewers + author and assign mergeator
					unassignReviewers();
					removeAssignees([author]);
					addAssignees([mergeator]);
				}
			}
		}

	}
} catch (error) {
  core.setFailed(error.message);
}

/**
 * Requests reviewers on the pull request
 */
async function requestReviews() {
	let reviewers = await getReviewersList();

	// add the reviewers
	requestReviewers(reviewers);

	// unassign the author
	removeAssignees([payload.pull_request.user.login]);

	// assign the reviewers
	addAssignees(reviewers);
}

/**
 * Check that the pull request has at least 2 approvals and the permanent reviewer approval
 */
async function isApproved() {
	let approvals = {},
		hasPermanentReviewerApproval = false,
		{ data: reviews } = await octokit.pulls.listReviews({
		  owner: repository_owner,
		  repo: repository_name,
		  pull_number: pullNumber,
		})
	;

	reviews.forEach(function(review) {
		if ('approved' === review.state) {
			let reviewAuthor = review.user.login;
			if (reviewAuthor === permanentReviewer) {
				hasPermanentReviewerApproval = true;
			}
			Object.assign(approvals, {reviewAuthor: 1});
		}
	});

	console.log(hasPermanentReviewerApproval, Object.keys(approvals).length,  approvalsNumber);

	return hasPermanentReviewerApproval && Object.keys(approvals).length >= approvalsNumber;
}

/**
 * Build the reviewers list of a pull request
 */
async function getReviewersList()
{
	let currentReviewers = await listReviewers(),
	    requestedReviewers = []
	;

	console.log(currentReviewers);

	// keep reviewers if they were already assigned
	if (currentReviewers.length > 0) {
		currentReviewers.forEach(function(reviewer) {
			requestedReviewers.push(reviewer.login);
		});
	}

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

			if (requestedReviewers.length < core.getInput('reviewers_number')
				&& !requestedReviewers.includes(login)
				&& collaborator.login !== author
			) {
				// add reviewer
				requestedReviewers.push(login);
			}
		});

		return requestedReviewers;
	}
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

function addAssignees(assignees)
{
	octokit.issues.addAssignees({
	  owner: repository_owner,
	  repo: repository_name,
	  issue_number: pullNumber,
	  assignees: assignees
	});
}

function removeAssignees(assignees)
{
	octokit.issues.removeAssignees({
	  owner: repository_owner,
	  repo: repository_name,
	  issue_number: pullNumber,
	  assignees: assignees
	});
}

function requestReviewers(reviewers)
{
	octokit.pulls.requestReviewers({
	  owner: repository_owner,
	  repo: repository_name,
	  pull_number: pullNumber,
	  reviewers: reviewers
	});
}

async function removeLabel(label)
{
	let { data: currentLabels } = await octokit.issues.listLabelsOnIssue({
		owner: repository_owner,
	    repo: repository_name,
	    issue_number: pullNumber,
	}),
	hasLabel = false;

	currentLabels.forEach(function(currentLabel) {
		if (currentLabel.name === label) {
			hasLabel = true;
		}
	});

	if (hasLabel) {
		octokit.issues.removeLabel({
		  owner: repository_owner,
		  repo: repository_name,
		  issue_number: pullNumber,
		  name: label
		});
	}
}

function addLabels(labels)
{
	octokit.issues.addLabels({
	  owner: repository_owner,
	  repo: repository_name,
	  issue_number: pullNumber,
	  labels: labels
	});
}

async function listReviewers()
{
	let { data: currentReviewers } = await octokit.pulls.listRequestedReviewers({
	  owner: repository_owner,
	  repo: repository_name,
	  pull_number: pullNumber,
	});

	return currentReviewers.users;
}

/**
 * Unassign the reviewers of the pull request
 */
async function unassignReviewers()
{
	let currentReviewers = await listReviewers(),
		reviewers = []
	;

	if (currentReviewers.length > 0) {
		currentReviewers.forEach(function (reviewer) {
			reviewers.push(reviewer.login);
		});

		removeAssignees(reviewers);
	}

}