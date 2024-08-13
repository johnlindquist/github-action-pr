export async function run(): Promise<void> {
  console.log('Running action....')
  try {
    console.log('Retrieving GitHub token...')
    const token: string = core.getInput('github-token', { required: true })
    console.log('Creating Octokit instance...')
    const octokit = github.getOctokit(token)

    console.log('Fetching changed files...')
    let listedFiles: Awaited<
      ReturnType<typeof octokit.rest.pulls.listFiles>
    >['data'] = []

    if (github.context.eventName === 'pull_request') {
      const pullRequestNumber = github.context.payload.pull_request?.number
      if (pullRequestNumber) {
        const { data } = await octokit.rest.pulls.listFiles({
          ...github.context.repo,
          pull_number: pullRequestNumber
        })
        listedFiles = data
      } else {
        console.log('Pull request number not found')
      }
    } else if (github.context.eventName === 'push') {
      const { data } = await octokit.rest.repos.compareCommits({
        ...github.context.repo,
        base: github.context.payload.before,
        head: github.context.payload.after
      })
      listedFiles = data.files || []
    } else {
      console.log(`Unsupported event: ${github.context.eventName}`)
    }

    console.log(`Found ${listedFiles.length} changed files`)

    console.log('Posting comment to PR...')
    // Check if we have a valid issue number
    if (!github.context.issue.number) {
      throw new Error('No issue/PR number found in the GitHub context')
    }

    const changeMap: ChangeMap = new Map()
    for (const file of listedFiles) {
      console.log({ file })
      if (file.status === 'removed') {
        console.log('File removed, skipping... Need to implement this')
        // changeMap.set(file.filename, {
        //   before: '',
        //   after: ''
        // })
        continue // Skip deleted files
      }

      let before: string | undefined
      let after: string | undefined

      if (file.status !== 'renamed') {
        let branchResponse:
          | Awaited<ReturnType<typeof octokit.rest.repos.getContent>>
          | undefined

        let prResponse:
          | Awaited<ReturnType<typeof octokit.rest.repos.getContent>>
          | undefined
        try {
          branchResponse = await octokit.rest.repos.getContent({
            ...github.context.repo,
            path: file.filename,
            ref: github.context.payload.pull_request?.base.ref // Use the PR's base branch
          })
        } catch (error) {
          console.log('Error fetching branch content', error)
          before = '<No content>'
        }

        try {
          prResponse = await octokit.rest.repos.getContent({
            ...github.context.repo,
            path: file.filename,
            ref: github.context.payload.pull_request?.head.sha // Use the PR's head commit SHA
          })
        } catch (error) {
          console.log('Error fetching PR content', error)
          before = '<Error fetching PR content>'
        }

        if (branchResponse && 'content' in branchResponse.data) {
          before = Buffer.from(branchResponse.data.content, 'base64').toString(
            'utf-8'
          )
        }

        if (prResponse && 'content' in prResponse.data) {
          after = Buffer.from(prResponse.data.content, 'base64').toString(
            'utf-8'
          )
        }
      }

      changeMap.set(file.filename, {
        before: before || '<No content>',
        after: after || '<No content>'
      })
    }

    const summary = await generateSummary(changeMap)

    console.log('Summary generated')

    // Post the comment to the PR
    await octokit.rest.issues.createComment({
      ...github.context.repo,
      issue_number: github.context.issue.number,
      body: summary
    })
    console.log('Comment posted successfully')

    console.log('Setting output...')
    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())
    console.log('Output set')

    console.log('Action completed successfully')
  } catch (error) {
    console.error('An error occurred:', error)
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      if (error.message.includes('No issue/PR number found')) {
        console.log(
          'This may be because the action is running on a push event, not a PR.'
        )
      }
      core.setFailed(error.message)
    } else {
      console.error('Unknown error type')
      core.setFailed('An unknown error occurred')
    }
  }
}
