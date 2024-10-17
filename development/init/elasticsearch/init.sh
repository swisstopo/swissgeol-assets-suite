#!/usr/bin/bash

# Elasticsearch URL
ELASTICSEARCH_URL="http://localhost:9200"

# Check if Elasticsearch is ready.
check_elasticsearch() {
  response=$(curl -s -o /dev/null -w "%{http_code}" "${ELASTICSEARCH_URL}/_cat/health")
  if [ "$response" == "200" ]; then
    return 0
  else
    return 1
  fi
}

# Create an index and define its mapping if it does not exist yet.
init_index() {
  local INDEX_NAME="$1"

  response=$(curl -s -o /dev/null -w "%{http_code}" "${ELASTICSEARCH_URL}/${INDEX_NAME}")

  # If index does not exist (HTTP response code 404)
  if [ "$response" != "404" ]; then
    echo "Index ${INDEX_NAME} already exists, skipping initialization"
    return 1
  fi

  echo "Initializing index ${INDEX_NAME}..."


  curl --silent -XPUT "${ELASTICSEARCH_URL}/${INDEX_NAME}"
  curl --silent -XPUT "${ELASTICSEARCH_URL}/${INDEX_NAME}/_mapping" -H 'Content-Type: application/json' -d "@/init/mappings/${INDEX_NAME}.json"

  echo "Successfully initialized index ${INDEX_NAME}"
}

# Wait until ElasticSearch is ready.
until check_elasticsearch; do
  echo "Elasticsearch is not yet ready, retrying initialization in 5 seconds..."
  sleep 5
done

echo "Elasticsearch is up and running, initializing indexes..."
init_index "swissgeol_asset_asset"
echo "Successfully initialized all indexes"