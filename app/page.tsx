"use client"

import Search from './search';
import {
  Badge,
  Button,
  Flex,
  Title,
  Subtitle,
  Text,
  Italic,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Grid
} from '@tremor/react';
import { format, parseISO } from 'date-fns';
import { graphql } from '@octokit/graphql';
import {
  GitPullRequestIcon,
  CheckIcon,
  XIcon,
  ShieldXIcon,
  QuestionIcon
} from '@primer/octicons-react';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

type repositoriesArray = []


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

const mergePR = async (branchId: any) => {
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

const getRepoData = async () => {
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


export default function IndexPage({
  searchParams
}: {
  searchParams: { q: string };
}) {
  const search = searchParams.q ?? '';
  const [data, setData] = useState<repositoriesArray>([])
  const [isLoading, setLoading] = useState('');
  const onMerge = (id: string) => {
    setLoading(id);
    mergePR(id);
    setTimeout(() => setLoading(''), 500);
  }

  useEffect(() => {
    getRepoData()
      .then((data: any) => {
        console.log("DATA: ", data)
        setData(data.user.repositories.nodes)
        setLoading('')
      })
  }, [])
  // const { getDetailsProps, setOpen } = useDetails({closeOnOutsideClick: true, ref})
  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl flex justify-center">
      {
        data.length == 0 ?
          <div
            className="p-16 m-60 h-20 w-20 align-center animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status">
            <span
              className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
            >Loading...</span
            >
          </div> :
          <Flex flexDirection="col" alignItems="center">
            <Flex justifyContent="between" alignItems="center">
              <Title>My Repos</Title>
              <Flex>
                <Flex alignItems="center" justifyContent='end' key="PRs">
                  <GitPullRequestIcon size={24} />
                  <Badge size="sm">
                    {getTotalPRs(data)}
                  </Badge>
                </Flex>
                {/*  NO CI HAS BEEN SETUP FOR THESE REPOS
              <Flex alignItems="center" key="noCI">
                <QuestionIcon size={24} fill="yellow" />
                <Badge size="sm">
                  {getTotalMissingCI(data, null)}
                </Badge>
              </Flex> */}
                <Flex alignItems="center" justifyContent='end' key="failures">
                  <ShieldXIcon size={24} fill="red" />
                  <Badge size="sm">
                    {getTotalFailures(data, 'FAILURE')}
                  </Badge>
                </Flex>
              </Flex>
            </Flex>

            <Grid numItemsLg={4} numItemsSm={1} numItemsMd={2}>
              {data &&
                sortReposPRCount(
                  filterForks(filterArchived(data))
                ).map((r: any) => (
                  <Accordion className="m-4 min-w-200" key={r}>
                    <AccordionHeader>

                      <Flex justifyContent="between" alignItems="center">
                        <Text>
                          <a href={r.url}>{r.name}</a>
                        </Text>
                        <Flex justifyContent="around" alignItems="center">
                          <Flex justifyContent="end" alignItems="center">
                            <GitPullRequestIcon />
                            <Badge size="sm">{r.pullRequests.totalCount}</Badge>
                          </Flex>
                          {r.defaultBranchRef != null && (
                            r.defaultBranchRef.target.status != null ? (
                              // CI is Passing / Failing
                              getStatusIcon(
                                r.defaultBranchRef.target.status.state == 'SUCCESS',
                                CheckIcon,
                                ShieldXIcon
                              )
                            ) : (
                              // No CI Setup
                              <QuestionIcon size={16} fill="yellow" />
                            )
                          )}
                        </Flex>
                      </Flex>
                    </AccordionHeader>
                    <AccordionBody>
                      {r.pullRequests.nodes.length == 0 ? (
                        <Subtitle>No PRs</Subtitle>
                      ) : r.pullRequests?.nodes.map((p: any) => (
                        <Flex flexDirection='col' key={p}>
                          <a href={p.url}>
                            <Text>{`${p.number}: ${p.title}`}</Text>
                          </a>
                          <Button
                            loading={isLoading == p.id}
                            data-id={p.id}
                            onClick={(p: any) => onMerge(p.target.parentNode.dataset.id)}
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
                            {p.baseRef != null && (
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
                            )
                            }
                          </Flex>
                        </Flex>
                      ))}
                    </AccordionBody>
                  </Accordion>
                ))}
            </Grid>
          </Flex>
      }
    </main>
  );
}
