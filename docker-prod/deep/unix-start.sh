curl https://raw.githubusercontent.com/deep-foundation/deeplinks/deepcase-23-menzorg/docker-prod/deep/docker-compose.yml > ./docker-compose.yml
curl https://raw.githubusercontent.com/deep-foundation/deeplinks/deepcase-23-menzorg/docker-prod/deep/open-deep.html > ./open-deep.html
echo 'Starting containers'
COMPOSE="$(docker-compose version --short)" MAJOR=${COMPOSE:0:1}; if [ "$MAJOR" = "2" ];  then export COMPATIBILITY='--compatibility'; fi; docker-compose -p deep $COMPATIBILITY up -d
echo 'Migrating data'
sleep 10
echo 'It will be faster soon, but now please wait...'
curl -s -X POST http://localhost:3007/api/deeplinks --data '{"operation":"run"}' --header "Content-Type: application/json" > /dev/null
echo 'Migrations done! Please, open file "open-deep.html"'
sleep 1