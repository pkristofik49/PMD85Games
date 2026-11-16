param([ValidateSet('Inspect','Enable','Status')][string]$Action='Inspect')
$ErrorActionPreference='Stop'
$env:GCM_INTERACTIVE='Never'
$credentialInput="protocol=https`nhost=github.com`n`n"
$credentialLines=$credentialInput | git -c credential.interactive=never credential fill 2>$null
if($LASTEXITCODE -ne 0){throw 'No existing GitHub credential is available. Authenticate Git before publishing.'}
$credential=@{}
foreach($line in $credentialLines){$parts=$line -split '=',2;if($parts.Count -eq 2){$credential[$parts[0]]=$parts[1]}}
if(-not $credential.password){throw 'No GitHub access token returned by the credential manager.'}
$headers=@{Authorization="Bearer $($credential.password)";Accept='application/vnd.github+json';'X-GitHub-Api-Version'='2022-11-28'}
$base='https://api.github.com/repos/pkristofik49/Flappy'
try{
 if($Action -eq 'Inspect'){
  $user=Invoke-RestMethod -Headers $headers -Uri 'https://api.github.com/user'
  $repo=Invoke-RestMethod -Headers $headers -Uri $base
  [PSCustomObject]@{Login=$user.login;Name=$user.name;UserId=$user.id;Email=$user.email;Repository=$repo.full_name;CanPush=$repo.permissions.push;CanAdmin=$repo.permissions.admin;HasPages=$repo.has_pages;DefaultBranch=$repo.default_branch}|ConvertTo-Json
 }elseif($Action -eq 'Enable'){
  $exists=$true
  try{$pages=Invoke-RestMethod -Headers $headers -Uri "$base/pages"}catch{if([int]$_.Exception.Response.StatusCode -eq 404){$exists=$false}else{throw}}
  if($exists){$pages=Invoke-RestMethod -Method Put -Headers $headers -Uri "$base/pages" -ContentType 'application/json' -Body '{"build_type":"workflow"}'}
  else{$pages=Invoke-RestMethod -Method Post -Headers $headers -Uri "$base/pages" -ContentType 'application/json' -Body '{"build_type":"workflow"}'}
  [PSCustomObject]@{Url=$pages.html_url;BuildType=$pages.build_type;Status=$pages.status}|ConvertTo-Json
 }else{
  $runs=Invoke-RestMethod -Headers $headers -Uri "$base/actions/runs?per_page=3"
  $runs.workflow_runs|Select-Object id,status,conclusion,html_url,head_sha|ConvertTo-Json
 }
}catch{
 # Avoid printing request headers, credentials or response objects containing secrets.
 $status=$_.Exception.Response.StatusCode
 throw "GitHub API action '$Action' failed (HTTP $status)."
}finally{$credential.Clear();$headers.Clear();$credentialLines=$null}
