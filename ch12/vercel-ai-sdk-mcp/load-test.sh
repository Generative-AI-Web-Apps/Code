for i in $(seq 1 50); do
  curl http://localhost:3000/api
  sleep 0.05 
done