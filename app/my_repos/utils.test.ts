import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { CheckIcon, XIcon } from '@primer/octicons-react';
import { getStatusIcon, sortReposPRCount, filterArchived, filterForks, getTotalPRs, getTotalFailures } from './utils';

describe('getStatusIcon', () => {
  it('returns SuccessIcon when condition is true', () => {
    const { container } = render(getStatusIcon(true, CheckIcon, XIcon));
    expect(container.querySelector('svg')).toHaveClass('octicon-check');
  });

  it('returns FailIcon when condition is false', () => {
    const { container } = render(getStatusIcon(false, CheckIcon, XIcon));
    expect(container.querySelector('svg')).toHaveClass('octicon-x');
  });
});

describe('sortReposPRCount', () => {
  it('sorts repos by PR count', () => {
    const repos = [
      { pullRequests: { nodes: [1, 2, 3] } },
      { pullRequests: { nodes: [1, 2] } },
      { pullRequests: { nodes: [1, 2, 3, 4] } },
    ];
    const sortedRepos = sortReposPRCount(repos);
    expect(sortedRepos[0].pullRequests.nodes.length).toBe(4);
    expect(sortedRepos[1].pullRequests.nodes.length).toBe(3);
    expect(sortedRepos[2].pullRequests.nodes.length).toBe(2);
  });
});

describe('filterArchived', () => {
  it('filters out archived repos', () => {
    const repos = [
      { isArchived: true },
      { isArchived: false },
      { isArchived: true },
    ];
    const filteredRepos = filterArchived(repos);
    expect(filteredRepos.length).toBe(1);
  });
});

describe('filterForks', () => {
  it('filters out forked repos', () => {
    const repos = [
      { isFork: true },
      { isFork: false },
      { isFork: true },
    ];
    const filteredRepos = filterForks(repos);
    expect(filteredRepos.length).toBe(1);
  });
});

describe('getTotalPRs', () => {
  it('calculates total PRs', () => {
    const repos = [
      { pullRequests: { nodes: [1, 2, 3] } },
      { pullRequests: { nodes: [1, 2] } },
      { pullRequests: { nodes: [1, 2, 3, 4] } },
    ];
    const totalPRs = getTotalPRs(repos);
    expect(totalPRs).toBe(9);
  });
});

describe('getTotalFailures', () => {
  it('calculates total failures', () => {
    const repos = [
      { defaultBranchRef: { target: { status: { state: 'FAILURE' } } } },
      { defaultBranchRef: { target: { status: { state: 'SUCCESS' } } } },
      { defaultBranchRef: { target: { status: { state: 'FAILURE' } } } },
    ];
    const totalFailures = getTotalFailures(repos, 'FAILURE');
    expect(totalFailures).toBe(2);
  });
});