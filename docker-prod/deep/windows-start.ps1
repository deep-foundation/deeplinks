wget -Uri "https://raw.githubusercontent.com/deep-foundation/deeplinks/main/docker-prod/deep/docker-compose.yml" -OutFile ".\docker-compose.yml"
wget -Uri "https://raw.githubusercontent.com/deep-foundation/deeplinks/main/docker-prod/deep/open-deep.html" -OutFile ".\open-deep.html"
docker-compose -p deep down -v --remove-orphans; docker-compose pull; docker-compose -p deep up -d
sleep 5
echo 'Migrating data'
echo 'It will be faster soon, but now please wait...'
$postParams = @{operation='run'}; wget -Method POST -Uri "http://localhost:3007/api/deeplinks" -Body $postParams | Out-Null
echo 'Migrations done!"'
sleep 1
Invoke-Expression .\open-deep.html
