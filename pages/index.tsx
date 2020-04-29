import {
  BaseStyles,
  Box,
  Button,
  CircleOcticon,
  CounterLabel,
  Details,
  Flex,
  Heading,
  Label,
  Link,
  StyledOcticon,
  Text
} from "@primer/components";
import { NextPage, NextPageContext } from "next";
import { graphql } from "@octokit/graphql"
import { GitPullRequest, Check, X, Question, ChevronDown } from "@primer/octicons-react";
import styled from 'styled-components'

const Navbar = styled(Flex)`
  width: 100%;
  height: 64px;
  background-color: #3600B8;
  color: white;
`
const NavbarContent = styled(Flex)`
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
const IconBlock = styled(Flex)``

const getStatusIcon = (condition, successIcon, failIcon) =>
  condition == true ?
    <StyledOcticon icon={successIcon} size={16} color="green.5" ml={2}/>
  :
    <StyledOcticon icon={failIcon} size={16} color="red.5" ml={2}/>;


const sortReposPRCount = repos => repos.sort((a, b) => {
  let retVal = 0;
  if (!a.pullRequests) retVal = -1;
  if (!b.pullRequests) retVal = 1;
  a.pullRequests.nodes.length < b.pullRequests.nodes.length ? retVal = 1 : retVal = -1;
  return retVal;
})

const sortReposDate = repos => repos.sort((a, b) => {
  let retVal = 0;
  if (a.defaultBranchRef == undefined) retVal = -1;
  if (b.defaultBranchRef == undefined) retVal = 1;
  if (a.defaultBranchRef && b.defaultBranchRef) {
    a.defaultBranchRef.target.committedDate < a.defaultBranchRef.target.committedDate ? retVal = 1 : retVal = -1;
  }
  return retVal;
})

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

const Home: NextPage<any> = ({ repos }) =>
  <BaseStyles>
    <Navbar alignItems="center" justifyContent="center">
      <NavbarContent alignItems="center" justifyContent="space-between">
        <Logo src="/static/logo.png" alt="my image" />
        <div>
          <Text>{repos.user.login}</Text>
          <StyledOcticon icon={ChevronDown} size={16} color="white" ml={2} />
        </div>
      </NavbarContent>
    </Navbar>
    <Flex flexDirection="column" alignItems="center">
      <Box width={600}>
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h1">My Repos</Heading>
          <IconBlock>
            <Flex alignItems="center" ml={2} key="PRs">
              <CircleOcticon icon={GitPullRequest} size={24} />
              <CounterLabel>{getTotalPRs(repos.user.repositories.nodes)}</CounterLabel>
            </Flex>
            <Flex alignItems="center" ml={2} key="noCI">
              <StyledOcticon icon={Question} size={24} color="yellow.5" ml={2} />
              <CounterLabel>{getTotalMissingCI(repos.user.repositories.nodes, null)}</CounterLabel>
            </Flex>
            <Flex alignItems="center" ml={2} key="failures">
              <StyledOcticon icon={X} size={24} color="red.5" ml={2} />
              <CounterLabel>{getTotalFailures(repos.user.repositories.nodes, "FAILURE")}</CounterLabel>
            </Flex>
          </IconBlock>
        </Flex>
        {repos && sortReposDate(repos.user.repositories.nodes).map(r => (
          <Details key={r.name}>
            <RepoCard as="summary">
              <Flex justifyContent="space-between" alignItems="center">
                <Text><Link href={r.url}>{r.name}</Link></Text>
                <IconBlock justifyContent="space-around" alignItems="center">
                  {r.pullRequests.nodes.length > 0 && <Label outline ml={2}>Show More</Label>}
                  {(r.defaultBranchRef != null) ?
                    <Text fontStyle="italic" fontSize={10} ml={2}>{r.defaultBranchRef.target.committedDate}</Text>
                  :
                    <Label>No Branches</Label>
                  }
                  <Flex alignItems="center" ml={2}>
                    <CircleOcticon icon={GitPullRequest} size={16} />
                    <CounterLabel>{r.pullRequests.totalCount}</CounterLabel>
                  </Flex>
                  {(r.defaultBranchRef != null) ?
                    (
                      r.defaultBranchRef.target.status != null ?
                        // CI is Passing / Failing
                        getStatusIcon(r.defaultBranchRef.target.status.state == "SUCCESS", Check, X)
                      :
                        // No CI Setup
                        <StyledOcticon icon={Question} size={16} color="yellow.5" ml={2}/>
                    )
                  :
                    <Label>No Branches</Label>
                  }
                </IconBlock>
              </Flex>
            </RepoCard>
            {r.pullRequests && r.pullRequests.nodes.map((p) => (
              <BranchCard key={p.title}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Link href={p.url}>
                    <Text>{`${p.number}: ${p.title}`}</Text>
                  </Link>
                  <IconBlock justifyContent="space-around" alignItems="center">
                    <Text fontStyle="italic" fontSize={10} ml={2}>{p.createdAt}</Text>
                      {getStatusIcon(p.mergeable, Check, X)}
                    {p.baseRef != null ?
                      (
                        p.baseRef.target.status != null ?
                          // CI is Passing / Failing
                          getStatusIcon(p.baseRef.target.status.state == "SUCCESS", Check, X)
                        :
                          // No CI Setup
                          <StyledOcticon icon={Question} size={16} color="yellow.5" ml={2}/>
                      )
                    :
                      <Label>No PRs</Label>
                    }
                  </IconBlock>
                </Flex>
              </BranchCard>
            ))}
          </Details>
        ))}
      </Box>
    </Flex>
  </BaseStyles>

Home.getInitialProps = async (context: NextPageContext) => {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`
    }
  });

  let repository;
  repository = await graphqlWithAuth(`
  {
    user(login: "dannyphillips") {
      login
      repositories(first: 50, affiliations: OWNER) {
        nodes {
          name
          url
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
    repos: repository,
  };
};

export default Home;
