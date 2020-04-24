import {
  BaseStyles,
  Box,
  CircleOcticon,
  CounterLabel,
  Flex,
  Heading,
  StyledOcticon
} from "@primer/components";
import { Fragment } from 'react'
import { NextPage, NextPageContext } from "next";
import { graphql } from "@octokit/graphql"
import { GitPullRequest, Check, X } from "@primer/octicons-react";

const Home: NextPage<any> = ({ repos }) => {
  debugger;
  return(
  <BaseStyles>
    <Flex flexDirection="column" alignItems="center">
      <Box width={600}>
        <Heading>My Repositories</Heading>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Conflicts</th>
              <th>Failures</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {repos && repos.user.repositories.nodes.map(r => (
              <Fragment key={r.name}>
                <tr>
                  <td><a href={r.url}>{r.name}</a></td>
                  <td>
                    <Flex alignItems="center">
                      <CircleOcticon icon={GitPullRequest} size={16} />
                      <CounterLabel>{r.pullRequests.totalCount}</CounterLabel>
                    </Flex>
                  </td>
                  <td>
                    {r.baseRef.target.status.state == "FAILURE" ?
                      <StyledOcticon icon={X} size={32} color="red.5" />
                      :
                      <StyledOcticon icon={Check} size={32} color="green.5" mr={2} />
                    }
                  </td>
                </tr>
                {r.pullRequests && r.pullRequests.nodes.map((p) => (
                  <tr key={p.title}>
                    <td>{`${p.number}: ${p.title}`}</td>
                    <td><a href={p.url}>{p.mergeable ?
                      <StyledOcticon icon={Check} size={32} color="green.5" mr={2} />
                      :
                      <StyledOcticon icon={X} size={32} color="red.5" />
                    }</a></td>
                    <td>{p.baseRef.target.status.state == "SUCCESS" ?
                      <StyledOcticon icon={Check} size={32} color="green.5" mr={2} />
                      :
                      <StyledOcticon icon={X} size={32} color="red.5" />
                    }</td>
                    <td>{p.createdAt}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
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
  // const { repositories } = await graphql({
  //   query: `
  //     {
  //       user(login: "dannyphillips") {
  //         repositories(first: 50, affiliations: OWNER) {
  //           nodes {
  //             name
  //             defaultBranchRef {
  //               ... on Ref {
  //                 associatedPullRequests {
  //                   totalCount
  //                 }
  //               }
  //             }
  //             pullRequests(first: 50, states: OPEN) {
  //               nodes {
  //                 title
  //                 mergeable
  //                 createdAt
  //                 number
  //               }
  //               totalCount
  //             }
  //           }
  //         }
  //       }
  //     }
  //   `
  //   ,
  //   headers: {
  //     authorization: `token 2a9ad3590e9d8895a6c81e05e25a897662739cbd`
  //   }
  // });
  return {
    repos: repository,
  };
};

export default Home;
