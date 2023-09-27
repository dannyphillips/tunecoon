import { graphql } from '@octokit/graphql';

export const getStatusIcon = (condition: any, SuccessIcon: any, FailIcon: any) =>
    condition == true ? (
        <SuccessIcon size= { 16} fill = "green" ml = { 2} />
  ) : (
    <FailIcon size= { 16} fill = "red" ml = { 2} />
  );

export const groupMRsBySemverBumps = (repos: any) => {
  const groupedMRs: { [key: string]: { major: any[], minorPatch: any[] } } = {};

  repos?.forEach((repo: any) => {
    const repoName = repo.name;
    const repoMRs = repo.pullRequests?.nodes;

    groupedMRs[repoName] = {
      major: [],
      minorPatch: []
    };

    repoMRs?.forEach((mr: any) => {
      const title = mr.title.toLowerCase();

      if (title.includes("major")) {
        groupedMRs[repoName].major.push(mr);
      } else {
        groupedMRs[repoName].minorPatch.push(mr);
      }
    });
  });

  return groupedMRs;
};

export const sortReposPRCount = (repos: any) =>
    repos?.sort((a: any, b: any) => {
        let retVal = 0;
        if (!a.pullRequests) retVal = -1;
        if (!b.pullRequests) retVal = 1;
        a.pullRequests?.nodes.length < b.pullRequests?.nodes.length
            ? (retVal = 1)
            : (retVal = -1);
        return retVal;
    });
export const filterArchived = (repos: any) =>
    repos?.filter((r: any) => r.isArchived == false);
export const filterForks = (repos: any) =>
    repos?.filter((r: any) => r.isFork == false);
// const sortReposDate = repos => repos?.sort((a, b) => {
//   let retVal = 0;
//   if (a.defaultBranchRef == undefined) retVal = 1;
//   if (b.defaultBranchRef == undefined) retVal = 1;
//   if (a.defaultBranchRef && b.defaultBranchRef) {
//     a.defaultBranchRef.target.committedDate < a.defaultBranchRef.target.committedDate ? retVal = 1 : retVal = -1;
//   }
//   return retVal;
// })

export const getTotalPRs = (repos: any) => {
    let sum = 0;
    repos?.forEach((r: any) => {
        sum += r.pullRequests.nodes.length;
    });
    return sum;
};

// const getTotalMissingCI = (repos: any, status: any) => {
//   let sum = 0;
//   repos?.forEach((r: any) => {
//     if (
//       r.defaultBranchRef != null &&
//       r.defaultBranchRef.target.status == status
//     ) {
//       sum += 1;
//     }
//   });
//   return sum;
// };
export const getTotalFailures = (repos: any, status: any) => {
    let sum = 0;
    repos?.forEach((r: any) => {
        if (
            r.defaultBranchRef != null &&
            r.defaultBranchRef.target.status != null &&
            r.defaultBranchRef.target.status.state == status
        ) {
            sum += 1;
        }
    });
    return sum;
};
const graphqlWithAuth = graphql.defaults({
    headers: {
        authorization: `token ${process.env.NEXT_PUBLIC_GITHUB_ACCESS_TOKEN}`
    }
});

export const mergePR = async (branchId: any) => {
    let res;
    res = await graphqlWithAuth(`
    mutation {
      mergePullRequest(input: {pullRequestId: "${branchId}"}) {
        actor {
          login
        }
      }
    }
  `);
    return res;
}

export const getRepoData = async () => {
    return await graphqlWithAuth(`
    {
      user(login: "dannyphillips") {
        login
        repositories(first: 50, affiliations: OWNER) {
          nodes {
            name
            url
            isFork
            isArchived
            defaultBranchRef {
              target {
                ... on Commit {
                  committedDate
                  status {
                    state
                  }
                }
              }
            }
            pullRequests(first: 50, states: OPEN) {
              totalCount
              nodes {
                id
                title
                mergeable
                createdAt
                number
                url
                baseRef {
                  target {
                    ... on Commit {
                      status {
                        state
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `);
}