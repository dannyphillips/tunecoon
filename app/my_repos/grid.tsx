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
import {
   GitPullRequestIcon,
   CheckIcon,
   XIcon,
   ShieldXIcon,
   QuestionIcon
} from '@primer/octicons-react';
import { getStatusIcon, sortReposPRCount, filterArchived, filterForks, getTotalPRs, getTotalFailures } from './utils'; 

export default function PRGrid(data: any, isLoading: string, onMerge: Function) {
   return (
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
   )
}