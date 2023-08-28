import {
  BaseStyles,
  Box,
  Button,
  CircleOcticon,
  CounterLabel,
  Details,
  Heading,
  Label,
  Link,
  StyledOcticon,
  Text, 
  // useDetails
} from "@primer/react";
import { NextPage, NextPageContext } from "next";
import { format, parseISO } from 'date-fns'
import { graphql } from "@octokit/graphql"
import { GitPullRequestIcon, CheckIcon, XIcon, QuestionIcon, ChevronDownIcon } from "@primer/octicons-react";
import styled from 'styled-components'

const Navbar = styled(Box)`
  width: 100%;
  height: 64px;
  background-color: #3600B8;
  color: white;
`
const NavbarContent = styled(Box)`
  width: 800px;
  padding: 16px;
`
const Logo = styled.img`
  height: 36px;
`

const RepoCard = styled(Button)`
  width: 100%;
  margin-top: 8px;
`
const BranchCard = styled.div`
  padding: 0px 16px;
  background-color: #fdfdfd;
  border: solid #e4e4e4 1px;
  border-top: 0px;
`
const Flex = styled(Box)``
const IconBlock = styled(Box)``

const getStatusIcon = (condition, SuccessIcon, FailIcon) =>
  condition == true ?
    <SuccessIcon size={16} fill="green" ml={2}/>
  :
    <FailIcon size={16} fill="red" ml={2}/>;


const sortReposPRCount = repos => repos.sort((a, b) => {
  let retVal = 0;
  if (!a.pullRequests) retVal = -1;
  if (!b.pullRequests) retVal = 1;
  a.pullRequests.nodes.length < b.pullRequests.nodes.length ? retVal = 1 : retVal = -1;
  return retVal;
})
const filterArchived = repos => repos.filter((r) => r.isArchived == false)
const filterForks = repos => repos.filter((r) => r.isFork == false)
// const sortReposDate = repos => repos.sort((a, b) => {
//   let retVal = 0;
//   if (a.defaultBranchRef == undefined) retVal = 1;
//   if (b.defaultBranchRef == undefined) retVal = 1;
//   if (a.defaultBranchRef && b.defaultBranchRef) {
//     a.defaultBranchRef.target.committedDate < a.defaultBranchRef.target.committedDate ? retVal = 1 : retVal = -1;
//   }
//   return retVal;
// })

const getTotalPRs = repos => {
  let sum = 0
  repos.forEach(r => {
    sum += r.pullRequests.nodes.length
  })
  return sum
}

const getTotalMissingCI = (repos, status) => {
  let sum = 0
  repos.forEach(r => {
    if (r.defaultBranchRef != null && r.defaultBranchRef.target.status == status) {
       sum += 1
    }
  })
  return sum
}
const getTotalFailures = (repos, status) => {
  let sum = 0
  repos.forEach(r => {
    if (r.defaultBranchRef != null && r.defaultBranchRef.target.status != null && r.defaultBranchRef.target.status.state == status) {
       sum += 1
    }
  })
  return sum
}
const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`
  }
});

const mergePR = async (branchId) => await graphqlWithAuth(`
  mutation {
    mergePullRequest(input: {pullRequestId: "${branchId}"}) {
      actor {
        login
      }
    }
  }
`);

const Home: NextPage<any> = ({ data }) => {
  // const { getDetailsProps, setOpen } = useDetails({closeOnOutsideClick: true, ref})
  return (
    <BaseStyles>
      <Navbar alignItems="center" justifyContent="center">
        <NavbarContent alignItems="center" justifyContent="space-between">
          <Logo src="/static/logo.png" alt="my image" />
          <div>
            <Text>{data.user.login}</Text>
            <ChevronDownIcon size={16} fill="white" />
          </div>
        </NavbarContent>
      </Navbar>
      <Flex flexDirection="column" alignItems="center">
        <Box width={600}>
          <Flex justifyContent="space-between" alignItems="center">
            <Heading as="h1">My Repos</Heading>
            <IconBlock>
              <Flex alignItems="center" ml={2} key="PRs">
                <GitPullRequestIcon size={24} />
                <CounterLabel>
                  {getTotalPRs(data.user.repositories.nodes)}
                </CounterLabel>
              </Flex>
              <Flex alignItems="center" ml={2} key="noCI">
                <QuestionIcon size={24} fill="yellow" />
                <CounterLabel>
                  {getTotalMissingCI(data.user.repositories.nodes, null)}
                </CounterLabel>
              </Flex>
              <Flex alignItems="center" ml={2} key="failures">
                <XIcon size={24} fill="red" />
                <CounterLabel>
                  {getTotalFailures(data.user.repositories.nodes, "FAILURE")}
                </CounterLabel>
              </Flex>
            </IconBlock>
          </Flex>
          {data.user.repositories &&
            sortReposPRCount(
              filterForks(filterArchived(data.user.repositories.nodes))
            ).map((r) => (
              <Details key={r.name}>
                <RepoCard as="summary">
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text>
                      <Link href={r.url}>{r.name}</Link>
                    </Text>
                    <IconBlock
                      justifyContent="space-around"
                      alignItems="center"
                    >
                      {r.pullRequests.nodes.length > 0 && (
                        <Label>
                          Show More
                        </Label>
                      )}
                      {r.defaultBranchRef != null ? (
                        <Text fontStyle="italic" fontSize={10} ml={2}>
                          {format(
                            parseISO(r.defaultBranchRef.target.committedDate),
                            "MM-dd-yyyy"
                          )}
                        </Text>
                      ) : (
                        <Label>No Branches</Label>
                      )}
                      <Flex alignItems="center" ml={2}>
                        <CircleOcticon icon={GitPullRequestIcon} size={16} />
                        <CounterLabel>{r.pullRequests.totalCount}</CounterLabel>
                      </Flex>
                      {r.defaultBranchRef != null ? (
                        r.defaultBranchRef.target.status != null ? (
                          // CI is Passing / Failing
                          getStatusIcon(
                            r.defaultBranchRef.target.status.state == "SUCCESS",
                            CheckIcon,
                            XIcon
                          )
                        ) : (
                          // No CI Setup
                          <QuestionIcon size={16} fill="yellow" />
                        )
                      ) : (
                        <Label>No Branches</Label>
                      )}
                    </IconBlock>
                  </Flex>
                </RepoCard>
                {r.pullRequests &&
                  r.pullRequests.nodes.map((p) => (
                    <BranchCard key={p.title}>
                      <Flex justifyContent="space-between" alignItems="center">
                        <Link href={p.url}>
                          <Text>{`${p.number}: ${p.title}`}</Text>
                        </Link>
                        <Button
                          data-id={p.id}
                          onClick={(p: any) => mergePR(p.target.dataset.id)}
                        >
                          Merge
                        </Button>
                        <IconBlock
                          justifyContent="space-around"
                          alignItems="center"
                        >
                          <Text fontStyle="italic" fontSize={10} ml={2}>
                            {format(
                              parseISO(p.createdAt),
                              "MM-dd-yyyy, h:m aa"
                            )}
                          </Text>
                          {getStatusIcon(p.mergeable, CheckIcon, XIcon)}
                          {p.baseRef != null ? (
                            p.baseRef.target.status != null ? (
                              // CI is Passing / Failing
                              getStatusIcon(
                                p.baseRef.target.status.state == "SUCCESS",
                                CheckIcon,
                                XIcon
                              )
                            ) : (
                              // No CI Setup
                              <StyledOcticon
                                icon={QuestionIcon}
                                size={16}
                                color="yellow.5"
                              />
                            )
                          ) : (
                            <Label>No PRs</Label>
                          )}
                        </IconBlock>
                      </Flex>
                    </BranchCard>
                  ))}
              </Details>
            ))}
        </Box>
      </Flex>
    </BaseStyles>
  );
};

Home.getInitialProps = async (context: NextPageContext) => {
  let data;
  data = await graphqlWithAuth(`
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
  return {
    data: data,
  };
};

export default Home;
