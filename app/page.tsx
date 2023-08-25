import {
  Badge,
  Button,
  Card,
  Flex,
  Title,
  Subtitle,
  Text,
  Italic
} from '@tremor/react';
import { InferGetServerSidePropsType, GetServerSideProps } from 'next';
import { format, parseISO } from 'date-fns';
import { graphql } from '@octokit/graphql';
import {
  GitPullRequestIcon,
  CheckIcon,
  XIcon,
  QuestionIcon
} from '@primer/octicons-react';

export const dynamic = 'force-dynamic';

type data = {
  users: {
    repositories: [];
  };
};

const getStatusIcon = (condition: any, SuccessIcon: any, FailIcon: any) =>
  condition == true ? (
    <SuccessIcon size={16} fill="green" ml={2} />
  ) : (
    <FailIcon size={16} fill="red" ml={2} />
  );

const sortReposPRCount = (repos: any) =>
  repos?.sort((a: any, b: any) => {
    let retVal = 0;
    if (!a.pullRequests) retVal = -1;
    if (!b.pullRequests) retVal = 1;
    a.pullRequests.nodes.length < b.pullRequests.nodes.length
      ? (retVal = 1)
      : (retVal = -1);
    return retVal;
  });
const filterArchived = (repos: any) =>
  repos?.filter((r: any) => r.isArchived == false);
const filterForks = (repos: any) =>
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

const getTotalPRs = (repos: any) => {
  let sum = 0;
  repos?.forEach((r: any) => {
    sum += r.pullRequests.nodes.length;
  });
  return sum;
};

const getTotalMissingCI = (repos: any, status: any) => {
  let sum = 0;
  repos?.forEach((r: any) => {
    if (
      r.defaultBranchRef != null &&
      r.defaultBranchRef.target.status == status
    ) {
      sum += 1;
    }
  });
  return sum;
};
const getTotalFailures = (repos: any, status: any) => {
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

const mergePR = async (branchId: any) =>
  await graphqlWithAuth(`
mutation {
  mergePullRequest(input: {pullRequestId: "${branchId}"}) {
    actor {
      login
    }
  }
}
`);

export const getServerSideProps: GetServerSideProps = async () => {
  let res: GetServerSideProps;
  res = await graphqlWithAuth(`
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
  const data = await res.json();
  return {
    data: data
  };
};

export default function Page({
  data
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  // const { getDetailsProps, setOpen } = useDetails({closeOnOutsideClick: true, ref})
  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      <Flex dir="column" alignItems="center">
        <Flex>
          <Flex justifyContent="between" alignItems="center">
            <Title>My Repos</Title>
            <Flex>
              <Flex alignItems="center" key="PRs">
                <GitPullRequestIcon size={24} />
                <Badge size="sm">
                  {getTotalPRs(data?.user.repositories.nodes)}
                </Badge>
              </Flex>
              <Flex alignItems="center" key="noCI">
                <QuestionIcon size={24} fill="yellow" />
                <Badge size="sm">
                  {getTotalMissingCI(data?.user.repositories.nodes, null)}
                </Badge>
              </Flex>
              <Flex alignItems="center" key="failures">
                <XIcon size={24} fill="red" />
                <Badge size="sm">
                  {getTotalFailures(data?.user.repositories.nodes, 'FAILURE')}
                </Badge>
              </Flex>
            </Flex>
          </Flex>
          {data?.user.repositories &&
            sortReposPRCount(
              filterForks(filterArchived(data?.user.repositories.nodes))
            ).map((r: any) => (
              <Flex key={r.name}>
                <Card>
                  <Flex justifyContent="between" alignItems="center">
                    <Text>
                      <a href={r.url}>{r.name}</a>
                    </Text>
                    <Flex justifyContent="around" alignItems="center">
                      {r.pullRequests.nodes.length > 0 && (
                        <Text>Show More</Text>
                      )}
                      {r.defaultBranchRef != null ? (
                        <Italic>
                          {format(
                            parseISO(r.defaultBranchRef.target.committedDate),
                            'MM-dd-yyyy'
                          )}
                        </Italic>
                      ) : (
                        <Text>No Branches</Text>
                      )}
                      <Flex alignItems="center">
                        <GitPullRequestIcon />
                        <Badge size="sm">{r.pullRequests.totalCount}</Badge>
                      </Flex>
                      {r.defaultBranchRef != null ? (
                        r.defaultBranchRef.target.status != null ? (
                          // CI is Passing / Failing
                          getStatusIcon(
                            r.defaultBranchRef.target.status.state == 'SUCCESS',
                            CheckIcon,
                            XIcon
                          )
                        ) : (
                          // No CI Setup
                          <QuestionIcon size={16} fill="yellow" />
                        )
                      ) : (
                        <Title>No Branches</Title>
                      )}
                    </Flex>
                  </Flex>
                </Card>
                {r.pullRequests &&
                  r.pullRequests.nodes.map((p) => (
                    <Card key={p.title}>
                      <Flex justifyContent="between" alignItems="center">
                        <a href={p.url}>
                          <Text>{`${p.number}: ${p.title}`}</Text>
                        </a>
                        <Button
                          data-id={p.id}
                          onClick={(p: any) => mergePR(p.target.dataset.id)}
                        >
                          Merge
                        </Button>
                        <Flex justifyContent="around" alignItems="center">
                          <Italic>
                            {format(
                              parseISO(p.createdAt),
                              'MM-dd-yyyy, h:m aa'
                            )}
                          </Italic>
                          {getStatusIcon(p.mergeable, CheckIcon, XIcon)}
                          {p.baseRef != null ? (
                            p.baseRef.target.status != null ? (
                              // CI is Passing / Failing
                              getStatusIcon(
                                p.baseRef.target.status.state == 'SUCCESS',
                                CheckIcon,
                                XIcon
                              )
                            ) : (
                              // No CI Setup
                              <QuestionIcon />
                            )
                          ) : (
                            <Subtitle>No PRs</Subtitle>
                          )}
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
              </Flex>
            ))}
        </Flex>
      </Flex>
    </main>
  );
}
