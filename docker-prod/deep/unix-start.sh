curl https://raw.githubusercontent.com/deep-foundation/deeplinks/main/docker-prod/deep/docker-compose.yml > ./docker-compose.yml
curl https://raw.githubusercontent.com/deep-foundation/deeplinks/main/docker-prod/deep/open-deep.html > ./open-deep.html
echo 'Clean and starting containers'
COMPOSE="$(docker-compose version --short)" MAJOR=${COMPOSE:0:1}; if [ "$MAJOR" = "2" ];  then export COMPATIBILITY='--compatibility'; fi;
docker-compose -p deep $COMPATIBILITY down -v --remove-orphans
docker-compose pull
docker-compose -p deep $COMPATIBILITY up -d
sleep 5
echo 'Migrating data'
sleep 5
echo 'It will be faster soon, but now please wait...'
curl -s -X POST http://localhost:3007/api/deeplinks --data '{"operation":"run"}' --header "Content-Type: application/json" > /dev/null
echo 'Migrations done!'
# (macos) || (linux) open default browser
(open ./open-deep.html) || (xdg-open ./open-deep.html 1>/dev/null 2>&1)
