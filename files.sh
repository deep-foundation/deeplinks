URL=http://localhost:3006/file
AUTH="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsiYWRtaW4iXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiYWRtaW4iLCJ4LWhhc3VyYS11c2VyLWlkIjoiMzYyIn0sImlhdCI6MTY2NzU4NjAyMX0.M37W4jo-8zwEpXt0yTJ-bUvKA0OGWSqinlX1KreiA3o"
BUCKET=default

FILE_ID=55af1e60-0f28-454e-885e-ea6aab2bb285
ETAG=\"588be441fe7a59460850b0aa3e1c5a65\"

# we sleep for 1s to make sure a drift in the clocks between client/server doesn't
# lead to a JWTIssuedAtFuture error
sleep 1

output=`curl http://localhost:3006/file \
  -v \
  -H "Content-Type: multipart/form-data" \
  -H "linkId: 652" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsiYWRtaW4iXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiYWRtaW4iLCJ4LWhhc3VyYS11c2VyLWlkIjoiMzYyIn0sImlhdCI6MTY2NzU4NjAyMX0.M37W4jo-8zwEpXt0yTJ-bUvKA0OGWSqinlX1KreiA3o" \
  -F "metadata[]={\"id\":\"55af1e60-0f28-454e-885e-ea6aab2bb285\", \"name\":\"test.txt\"};type=application/json" \
  -F "file[]=@./test.txt"`

echo $output

# time curl -v -o test0.jpg $URL/${FILE_ID} \
#       -H "$AUTH"

# time curl -v -o test1.jpg $URL/${FILE_ID}?w=600\&h\=200\&q=50\&b=5 \
#       -H "$AUTH"
