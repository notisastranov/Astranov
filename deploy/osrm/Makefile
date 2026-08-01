# Astranov OSRM helpers
.PHONY: rhodes aegean greece rebuild up down test logs clean-derived

rhodes:
	REGION=rhodes ./prepare.sh

aegean:
	REGION=aegean ./prepare.sh

greece:
	REGION=greece ./prepare.sh

rebuild:
	FORCE=1 REGION=$${REGION:-rhodes} ./prepare.sh

up:
	docker compose up -d

down:
	docker compose down

test:
	@curl -sS 'http://127.0.0.1:5000/route/v1/driving/28.2176,36.4341;28.22,36.44?overview=false' | head -c 400; echo

logs:
	docker compose logs -f --tail=100

# Keep raw Greece PBF; drop cut/filter/graph for a region
clean-derived:
	rm -f data/astranov-*.cut.pbf data/astranov-*.highway.pbf data/astranov-*.osm.pbf data/astranov-*.osrm*
