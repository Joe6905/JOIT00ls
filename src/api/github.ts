import type { GitHubRepo, GitHubUser } from '../types';

const GITHUB_API = 'https://api.github.com';

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid GitHub token. Please check and try again.');
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    login: data.login,
    name: data.name,
    avatar_url: data.avatar_url,
    public_repos: data.public_repos,
    followers: data.followers,
  };
}

export async function fetchUserRepos(token: string, page = 1, perPage = 100): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${GITHUB_API}/user/repos?sort=updated&per_page=${perPage}&page=${page}&type=all`,
    { headers: getHeaders(token) }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch repos: ${res.status}`);
  }

  const repos: GitHubRepo[] = await res.json();
  return repos.map(r => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    html_url: r.html_url,
    clone_url: r.clone_url,
    homepage: r.homepage,
    language: r.language,
    topics: r.topics || [],
    stargazers_count: r.stargazers_count,
    updated_at: r.updated_at,
    default_branch: r.default_branch,
    visibility: r.visibility,
  }));
}

export async function fetchAllUserRepos(token: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const repos = await fetchUserRepos(token, page, 100);
    allRepos.push(...repos);
    if (repos.length < 100) break;
    page++;
  }

  return allRepos;
}

export async function fetchRepoByUrl(token: string, repoUrl: string): Promise<GitHubRepo | null> {
  try {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;

    const [, owner, repo] = match;
    const cleanRepo = repo.replace('.git', '');

    const res = await fetch(`${GITHUB_API}/repos/${owner}/${cleanRepo}`, {
      headers: getHeaders(token),
    });

    if (!res.ok) return null;
    const data = await res.json();

    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      description: data.description,
      html_url: data.html_url,
      clone_url: data.clone_url,
      homepage: data.homepage,
      language: data.language,
      topics: data.topics || [],
      stargazers_count: data.stargazers_count,
      updated_at: data.updated_at,
      default_branch: data.default_branch,
      visibility: data.visibility,
    };
  } catch {
    return null;
  }
}

export async function fetchRepoReadme(token: string, fullName: string): Promise<string | null> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${fullName}/readme`, {
      headers: { ...getHeaders(token), Accept: 'application/vnd.github.v3.raw' },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.substring(0, 500);
  } catch {
    return null;
  }
}
