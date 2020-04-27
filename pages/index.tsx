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
  StyledOcticon
} from "@primer/components";
import { Fragment } from 'react'
import { NextPage, NextPageContext } from "next";
import { graphql } from "@octokit/graphql"
import { GitPullRequest, Check, X, Question } from "@primer/octicons-react";

const Home: NextPage<any> = ({ repos }) => {
  return(
  <BaseStyles>
    <Flex flexDirection="column" alignItems="center">
      <Box width={600}>
        <Heading as="h1">My Repositories</Heading>
          {repos && repos.user.repositories.nodes.map(r => (
            <Details key={r.name}>
                <Button as="summary">
                <div><a href={r.url}>{r.name}</a></div>
                <div>
                  <Flex alignItems="center">
                    <CircleOcticon icon={GitPullRequest} size={16} />
                    <CounterLabel>{r.pullRequests.totalCount}</CounterLabel>
                  </Flex>
                </div>
                <div>
                  {(r.defaultBranchRef != null) ?
                    (
                      r.defaultBranchRef.target.status == null ?
                        <StyledOcticon icon={Question} size={32} color="yellow.5" mr={2} />
                      :
                        (
                          r.defaultBranchRef.target.status.state == "SUCCESS" ?
                            <StyledOcticon icon={Check} size={32} color="green.5" mr={2} />
                          :
                            <StyledOcticon icon={X} size={32} color="red.5" />
                        )
                    )
                  :
                    <div>No Targets</div>
                  }
                </div>
                <div>
                  <Label as="summary">Show More</Label>
                </div>
                </Button>
              {r.pullRequests && r.pullRequests.nodes.map((p) => (
                <div key={p.title}>
                  <div>{`${p.number}: ${p.title}`}</div>
                  <div>
                    <a href={p.url}>
                      {p.mergeable ?
                        <StyledOcticon icon={Check} size={32} color="green.5" mr={2} />
                      :
                        <StyledOcticon icon={X} size={32} color="red.5" />
                      }
                    </a>
                  </div>
                  <div>
                    {p.baseRef != null ?
                      (
                        p.baseRef.target.status == null ?
                          <StyledOcticon icon={Question} size={32} color="yellow.5" mr={2} />
                        :
                          (
                            p.baseRef.target.status.state == "SUCCESS" ?
                              <StyledOcticon icon={Check} size={32} color="green.5" mr={2} />
                            :
                              <StyledOcticon icon={X} size={32} color="red.5" />
                          )
                      )
                    :
                      <div>No Targets</div>
                    }
                  </div>
                  <div>{p.createdAt}</div>
                </div>
              ))}
            </Details>
          ))}
      </Box>
    </Flex>
  </BaseStyles>
);
}

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
      repositories(first: 50, affiliations: OWNER) {
        nodes {
          name
          url
          defaultBranchRef {
            target {
              ... on Commit {
                status {
                  state
                }
              }
            }
          }
          pullRequests(first: 50, states: OPEN) {
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
            totalCount
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
