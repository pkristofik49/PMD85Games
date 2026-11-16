// A new repository can run validation before its owner enables GitHub Pages.
import fs from 'node:fs';
const repository=process.env.GITHUB_REPOSITORY;
if(!repository||!process.env.GITHUB_OUTPUT)throw Error('Run this probe in GitHub Actions');
const response=await fetch(`https://api.github.com/repos/${repository}/pages`,{
 headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,'X-GitHub-Api-Version':'2022-11-28'}
});
if(response.status!==200&&response.status!==404)throw Error(`Pages configuration probe returned HTTP ${response.status}`);
const enabled=response.status===200;
fs.appendFileSync(process.env.GITHUB_OUTPUT,`enabled=${enabled}\n`);
if(!enabled)console.log('::notice::Checks passed and the Pages artifact is ready. Enable Settings > Pages > Source: GitHub Actions, then run this workflow again to publish.');
