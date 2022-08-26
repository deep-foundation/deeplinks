curl https://raw.githubusercontent.com/deep-foundation/deeplinks/main/docker-prod/deep/docker-compose.yml > ./docker-compose.yml
echo 'Clean and starting containers'
docker-compose -p deep down -v --remove-orphans
docker-compose pull
docker-compose -p deep up -d
sleep 5
echo 'Migrating data'
sleep 5
echo 'It will be faster soon, but now please wait...'
curl -s -X POST http://localhost:3007/api/deeplinks --data '{"operation":"run"}' --header "Content-Type: application/json" > /dev/null
echo 'Migrations done!'
# (macos) || (linux) open default browser
(open http://localhost:3007/ 1>/dev/null 2>&1) || (xdg-open http://localhost:3007/ 1>/dev/null 2>&1)
