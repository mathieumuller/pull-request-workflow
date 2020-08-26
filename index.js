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
		console.log(context);
	}
} catch (error) {
  core.setFailed(error.message);
}

/**
 * Requests reviewers on the pull request
 */
async function requestReviews() {
	let pullRequest = payload.pull_request,
		pullNumber = pullRequest.number,
		pullAuthor = pullRequest.user.login,
	    reviewers = await getReviewersList(pullNumber, pullAuthor)
	;

	// add the reviewers
	octokit.pulls.requestReviewers({
	  owner: repository_owner,
	  repo: repository_name,
	  pull_number: pullNumber,
	  reviewers: reviewers
	});

	// unassign the author
	octokit.issues.removeAssignees({
	  owner: repository_owner,
	  repo: repository_name,
	  issue_number: pullNumber,
	  assignees: [pullAuthor]
	});

	// assign the reviewers
	octokit.issues.addAssignees({
	  owner: repository_owner,
	  repo: repository_name,
	  issue_number: pullNumber,
	  assignees: reviewers
	});
}

/**
 * Build the reviewers list of a pull request
 */
async function getReviewersList(pullNumber, pullAuthor)
{
	let { data: currentReviewers } = await octokit.pulls.listRequestedReviewers({
		  owner: repository_owner,
		  repo: repository_name,
		  pull_number: pullNumber,
		}),
	    requestedReviewers = []
	;

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
				&& collaborator.login !== pullAuthor
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
