const core = require("@actions/core")
const github = require("@actions/github")

async function run() {
	try {
		const token = core.getInput("github-token")
		const octokit = github.getOctokit(token)
		const context = github.context

		const { data: files } = await octokit.rest.pulls.listFiles({
			owner: context.repo.owner,
			repo: context.repo.repo,
			pull_number: context.payload.pull_request.number
		})

		const fileList = files.map((file) => file.filename).join("\n")

		await octokit.rest.issues.createComment({
			owner: context.repo.owner,
			repo: context.repo.repo,
			issue_number: context.payload.pull_request.number,
			body: `This PR includes the following files:\n\n${fileList}`
		})
	} catch (error) {
		core.setFailed(error.message)
	}
}

run()
