wget -Uri "https://raw.githubusercontent.com/deep-foundation/deeplinks/main/docker-prod/deep/docker-compose.yml" -OutFile ".\docker-compose.yml"
wget -Uri "https://raw.githubusercontent.com/deep-foundation/deeplinks/main/docker-prod/deep/open-deep.html" -OutFile ".\open-deep.html"
docker-compose -p deep up -d
$postParams = @{operation='run'}; wget -Method POST -Uri "http://localhost:3007/api/deeplinks" -Body $postParams