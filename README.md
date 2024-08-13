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
