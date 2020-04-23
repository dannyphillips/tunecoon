import {
  BaseStyles,
  Box,
  Heading,
  CircleOcticon,
  Flex
} from "@primer/components";
import { Fragment } from 'react'
import { NextPage, NextPageContext } from "next";
import { graphql } from "@octokit/graphql"
import { GitPullRequest } from "@primer/octicons-react";

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
              <th>Open Pulls</th>
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
                      {r.pullRequests.totalCount}
                    </Flex>
                  </td>
                </tr>
                {r.pullRequests && r.pullRequests.nodes.map((p) => (
                  <tr key={p.title}>
                    <td>{`${p.number}: ${p.title}`}</td>
                    <td><a href={p.url}>{p.mergeable}</a></td>
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
            ... on Ref {
              associatedPullRequests {
                totalCount
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
