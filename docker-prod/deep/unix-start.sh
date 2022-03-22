curl https://raw.githubusercontent.com/deep-foundation/deeplinks/main/docker-prod/deep/docker-compose.yml > ./docker-compose.yml
curl https://raw.githubusercontent.com/deep-foundation/deeplinks/main/docker-prod/deep/open-deep.html > ./open-deep.html
docker-compose -p deep up -d
echo 'Migrating data.'
sleep 8
echo 'It will be faster soon, but now please wait...'
curl -X POST http://localhost:3007/api/deeplinks --data '{"operation":"run"}' --header "Content-Type: application/json"
echo 'Migrations done!'
sleep 1
