#!/bin/bash

# Number of parallel requests to API
NO_PARALLEL=50

# Number of times to repeat the batch of $NO_PARALLEL parallel requests
COUNT=500

# API endpoint and headers
URL="http://localhost:4200/api/assets"
AUTH_HEADER="authorization: Bearer <omit>"  # Replace with your actual token

# Function to generate random geometries as JSON using Python
generate_geometries() {
  python3 - <<EOF
import random, json

BASE_X = round(random.uniform(2500000, 2800000), 3)
BASE_Y = round(random.uniform(1100000, 1300000), 3)

def gen_x_coord(local=False):
    if local:
        return round(BASE_X + random.uniform(-10000, 10000), 3)
    return round(random.uniform(2500000, 2800000), 3)

def gen_y_coord(local=False):
    if local:
        return round(BASE_Y + random.uniform(-10000, 10000), 3)
    return round(random.uniform(1100000, 1300000), 3)

# Polygon from local coords
def get_random_poly():
  polygon = [(gen_x_coord(local=True), gen_y_coord(local=True)) for _ in range(5)]
  polygon.append(polygon[0])
  return "POLYGON((" + ",".join(f"{x} {y}" for x, y in polygon) + "))"

# Point is still random anywhere
def get_random_point():
  point_x, point_y = gen_x_coord(), gen_y_coord()
  return f"POINT({point_x} {point_y})"

# Line from local coords
def get_random_line():
  line = [(gen_x_coord(local=True), gen_y_coord(local=True)) for _ in range(random.randint(5, 7))]
  return "LINESTRING(" + ",".join(f"{x} {y}" for x, y in line) + ")"

geometries = []

if random.random() < 0.25:
    for _ in range(random.randint(1,4)):
      geometries.append({"mutation": "Create", "type": "Polygon", "text": get_random_poly()})

if random.random() < 0.95:
    for _ in range(random.randint(1,4)):
      geometries.append({"mutation": "Create", "type": "Point", "text": get_random_point()})

if random.random() < 0.10:
    for _ in range(random.randint(1,4)):
      geometries.append({"mutation": "Create", "type": "LineString", "text": get_random_line()})

print(json.dumps(geometries))
EOF
}

# Main loop
for ((i = 1; i <= COUNT; i++)); do
  echo "Batch [$i]: Sending $NO_PARALLEL parallel requests..."

  for ((j = 1; j <= NO_PARALLEL; j++)); do
    (
      GEOMETRIES=$(generate_geometries)

      PAYLOAD=$(cat <<EOF
{
  "title": "test123",
  "originalTitle": "test123",
  "isOfNationalInterest": false,
  "isPublic": false,
  "formatCode": "graphicVector",
  "kindCode": "report",
  "languageCodes": [],
  "nationalInterestTypeCodes": [],
  "topicCodes": ["energyRessources"],
  "identifiers": [],
  "contacts": [],
  "parent": null,
  "siblings": [],
  "workgroupId": 1,
  "createdAt": "2025-07-24",
  "receivedAt": "2025-07-24",
  "geometries": $GEOMETRIES
}
EOF
)

      STATUS=$(curl -s -o /dev/null -w "%{http_code}" --request POST "$URL" \
        --header "accept: application/json, text/plain, */*" \
        --header "content-type: application/json" \
        --header "$AUTH_HEADER" \
        --data "$PAYLOAD")

      echo "  Request [$i.$j] finished with status $STATUS"
    ) &
  done

  wait  # Wait for the background requests to finish before next iteration
done
